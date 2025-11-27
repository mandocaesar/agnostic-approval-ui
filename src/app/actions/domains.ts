"use server";

import { prisma } from "@/lib/prisma";
import type { Domain, Subdomain } from "@/types";
import { revalidatePath } from "next/cache";

export async function getDomains(): Promise<Domain[]> {
    const domains = await prisma.domain.findMany({
        include: {
            subdomains: true,
        },
    });

    // Get approval counts for each domain
    const domainsWithCounts = await Promise.all(
        domains.map(async (domain) => {
            const activeApprovalCount = await prisma.approval.count({
                where: {
                    domainId: domain.id,
                    status: "in_process",
                },
            });

            const subdomainsWithCounts = await Promise.all(
                domain.subdomains.map(async (sub) => {
                    const subApprovalCount = await prisma.approval.count({
                        where: {
                            domainId: domain.id,
                            subdomainId: sub.id,
                            status: "in_process",
                        },
                    });
                    return {
                        ...sub,
                        activeApprovalCount: subApprovalCount,
                    };
                })
            );

            return {
                ...domain,
                subdomains: subdomainsWithCounts,
                activeApprovalCount,
            } as Domain;
        })
    );

    return domainsWithCounts;
}

export async function createDomain(
    name: string,
    description: string,
    tags: string[]
): Promise<Domain> {
    const newDomain = await prisma.domain.create({
        data: {
            name,
            description,
            tags,
        },
        include: {
            subdomains: true,
        },
    });

    revalidatePath("/dashboard/domains");
    return newDomain as Domain;
}

export async function updateDomain(
    id: string,
    updates: Partial<Domain>
): Promise<Domain> {
    const updatedDomain = await prisma.domain.update({
        where: { id },
        data: {
            name: updates.name,
            description: updates.description,
            tags: updates.tags,
            owner: updates.owner,
            connectivity: updates.connectivity,
        },
        include: {
            subdomains: true,
        },
    });

    revalidatePath("/dashboard/domains");
    return updatedDomain as Domain;
}

export async function deleteDomain(id: string): Promise<void> {
    await prisma.domain.delete({
        where: { id },
    });
    revalidatePath("/dashboard/domains");
}

export async function createSubdomain(
    domainId: string,
    name: string,
    description: string,
    tags: string[]
): Promise<Subdomain> {
    const newSubdomain = await prisma.subdomain.create({
        data: {
            name,
            description,
            tags,
            domainId,
        },
    });

    revalidatePath("/dashboard/domains");
    return newSubdomain as Subdomain;
}

export async function updateSubdomain(
    domainId: string,
    subdomainId: string,
    updates: Partial<Subdomain>
): Promise<Subdomain> {
    const updatedSubdomain = await prisma.subdomain.update({
        where: { id: subdomainId },
        data: {
            name: updates.name,
            description: updates.description,
            tags: updates.tags,
            connectivity: updates.connectivity,
        },
    });

    revalidatePath("/dashboard/domains");
    return updatedSubdomain as Subdomain;
}

export async function deleteSubdomain(
    domainId: string,
    subdomainId: string
): Promise<void> {
    await prisma.subdomain.delete({
        where: { id: subdomainId },
    });
    
    revalidatePath("/dashboard/domains");
}
