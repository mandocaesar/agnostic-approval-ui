import { prisma } from "@/lib/prisma";
import { mq } from "@/lib/queue";
import { successResponse, ApiErrors, withErrorHandling, generateRequestId } from "@/lib/api-response";

export const GET = withErrorHandling(async (request: Request, context?: Record<string, unknown>) => {
  const requestId = context?.requestId as string;
  const { searchParams } = new URL(request.url);

  const domainId = searchParams.get("domainId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  // Validate pagination params
  if (page < 1 || limit < 1 || limit > 100) {
    return ApiErrors.badRequest("Invalid pagination parameters", {
      page: "Must be >= 1",
      limit: "Must be between 1 and 100"
    }, requestId);
  }

  // Validate status if provided
  const validStatuses = ["in_process", "approved", "reject", "end"];
  if (status && !validStatuses.includes(status)) {
    return ApiErrors.badRequest(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, undefined, requestId);
  }

  // Build where clause
  const where: Record<string, unknown> = {};
  if (domainId) where.domainId = domainId;
  if (status) where.status = status;

  // Fetch approvals with pagination
  const [approvals, total] = await Promise.all([
    prisma.approval.findMany({
      where,
      orderBy: { lastUpdatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.approval.count({ where }),
  ]);

  return successResponse({
    approvals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, requestId);
});

export const POST = withErrorHandling(async (request: Request, context?: Record<string, unknown>) => {
  const requestId = context?.requestId as string;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return ApiErrors.badRequest("Invalid JSON body", undefined, requestId);
  }

  // Validate required fields
  const missingFields: string[] = [];
  if (!body.title) missingFields.push("title");
  if (!body.domainId) missingFields.push("domainId");
  if (!body.subdomainId) missingFields.push("subdomainId");
  if (!body.flowId) missingFields.push("flowId");
  if (!body.requesterId) missingFields.push("requesterId");

  if (missingFields.length > 0) {
    return ApiErrors.badRequest(`Missing required fields: ${missingFields.join(", ")}`, {
      missingFields
    }, requestId);
  }

  // Validate foreign keys exist
  const [domain, subdomain, flow, requester] = await Promise.all([
    prisma.domain.findUnique({ where: { id: body.domainId } }),
    prisma.subdomain.findUnique({ where: { id: body.subdomainId } }),
    prisma.approvalFlow.findUnique({ where: { id: body.flowId } }),
    prisma.user.findUnique({ where: { id: body.requesterId } }),
  ]);

  if (!domain) {
    return ApiErrors.notFound("Domain", requestId);
  }
  if (!subdomain) {
    return ApiErrors.notFound("Subdomain", requestId);
  }
  if (!flow) {
    return ApiErrors.notFound("Approval flow", requestId);
  }
  if (!requester) {
    return ApiErrors.notFound("Requester user", requestId);
  }

  // Validate subdomain belongs to domain
  if (subdomain.domainId !== domain.id) {
    return ApiErrors.badRequest("Subdomain does not belong to the specified domain", undefined, requestId);
  }

  // Validate flow belongs to subdomain
  if (flow.subdomainId !== subdomain.id) {
    return ApiErrors.badRequest("Flow does not belong to the specified subdomain", undefined, requestId);
  }

  // Create approval with transaction for atomicity
  const approval = await prisma.$transaction(async (tx) => {
    // Create approval
    const newApproval = await tx.approval.create({
      data: {
        title: body.title,
        domainId: body.domainId,
        subdomainId: body.subdomainId,
        flowId: body.flowId,
        requesterId: body.requesterId,
        approverIds: body.approverIds || [],
        status: "in_process",
        currentStageId: null,
        payload: body.payload || {},
        metadata: {
          iterationCount: 0,
          comments: [],
          ...(body.metadata || {}),
        },
      },
    });

    // Create log entry
    await tx.logEntry.create({
      data: {
        level: "info",
        message: `New approval created: ${newApproval.title}`,
        context: {
          approvalId: newApproval.id,
          approvalTitle: newApproval.title,
          requesterId: newApproval.requesterId,
          domainId: newApproval.domainId,
          subdomainId: newApproval.subdomainId,
          flowId: newApproval.flowId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return newApproval;
  });

  // Publish event (outside transaction - fire and forget)
  try {
    await mq.publish("approval-events", "approval.created", {
      approvalId: approval.id,
      title: approval.title,
      domainId: approval.domainId,
      requesterId: approval.requesterId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Event Publishing Error]", error);
    // Don't fail the request if event publishing fails
  }

  return new Response(JSON.stringify({
    success: true,
    data: approval,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  }), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
      ...(requestId && { 'X-Request-ID': requestId }),
    },
  });
});
