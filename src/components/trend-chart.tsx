"use client";

import { useEffect, useRef } from "react";
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartConfiguration,
    BarController,
    LineController
} from 'chart.js';

Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    BarController,
    LineController,
    Title,
    Tooltip,
    Legend
);

interface TrendDataPoint {
    date: string;
    count: number;
    billpayment: number;
    procurement: number;
    ibb: number;
}

interface TrendChartProps {
    data: TrendDataPoint[];
    title?: string;
    height?: number;
}

// Chart.js standard colors
const CHART_COLORS = {
    red: 'rgb(255, 99, 132)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
};

function transparentize(color: string, opacity: number = 0.5) {
    const alpha = opacity === undefined ? 0.5 : 1 - opacity;
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
}

export function TrendChart({ data, title = "Approval Trend", height = 300 }: TrendChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    // Check if there's any data
    const hasData = data.some(d => d.count > 0 || d.billpayment > 0 || d.procurement > 0 || d.ibb > 0);

    useEffect(() => {
        if (!canvasRef.current || !hasData) return;

        // Destroy existing chart
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const labels = data.map(d => d.date);
        
        const config: ChartConfiguration = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Bill Payment',
                        data: data.map(d => d.billpayment),
                        borderColor: CHART_COLORS.red,
                        backgroundColor: transparentize(CHART_COLORS.red, 0.5),
                        order: 1
                    },
                    {
                        label: 'Procurement',
                        data: data.map(d => d.procurement),
                        borderColor: CHART_COLORS.yellow,
                        backgroundColor: transparentize(CHART_COLORS.yellow, 0.5),
                        order: 1
                    },
                    {
                        label: 'IBB',
                        data: data.map(d => d.ibb),
                        borderColor: CHART_COLORS.green,
                        backgroundColor: transparentize(CHART_COLORS.green, 0.5),
                        order: 1
                    },
                    {
                        label: 'Total',
                        data: data.map(d => d.count),
                        borderColor: CHART_COLORS.blue,
                        backgroundColor: transparentize(CHART_COLORS.blue, 0.5),
                        type: 'line',
                        order: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Approval Trends by Domain'
                    }
                }
            }
        };

        chartRef.current = new Chart(ctx, config);

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [data, hasData]);

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            {!hasData ? (
                <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
                    <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-slate-900">No data available</h3>
                        <p className="mt-1 text-sm text-slate-500">Start creating approvals to see trends</p>
                    </div>
                </div>
            ) : (
                <div style={{ height: `${height}px` }}>
                    <canvas ref={canvasRef} />
                </div>
            )}
        </div>
    );
}
