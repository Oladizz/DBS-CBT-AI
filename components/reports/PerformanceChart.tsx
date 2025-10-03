
import React from 'react';
import { Submission } from '../../types';

interface PerformanceChartProps {
    submissions: Submission[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ submissions }) => {
    if (submissions.length < 2) {
        return (
            <div className="flex items-center justify-center h-48 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Not enough data for a performance trend.</p>
            </div>
        );
    }
    
    const sortedSubmissions = [...submissions].sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());

    const width = 500;
    const height = 200;
    const padding = 40;

    const points = sortedSubmissions.map((sub, index) => {
        const x = padding + (index * (width - padding * 2)) / (sortedSubmissions.length - 1);
        const y = height - padding - (sub.score / 100) * (height - padding * 2);
        return { x, y, score: sub.score, date: sub.submittedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    });

    const pathD = "M" + points.map(p => `${p.x} ${p.y}`).join(" L");
    const areaD = pathD + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-label={`A line chart showing student performance over ${submissions.length} tests.`}>
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Y-axis */}
                <line x1={padding} y1={padding - 10} x2={padding} y2={height - padding} stroke="#e5e7eb" />
                <text x={padding - 10} y={padding - 10} textAnchor="end" alignmentBaseline="middle" fontSize="10" fill="#6b7280">100%</text>
                <text x={padding - 10} y={height - padding} textAnchor="end" alignmentBaseline="middle" fontSize="10" fill="#6b7280">0%</text>
                
                {/* X-axis */}
                <line x1={padding} y1={height - padding} x2={width - padding + 10} y2={height - padding} stroke="#e5e7eb" />
                
                {/* Area under line */}
                <path d={areaD} fill="url(#areaGradient)" />

                {/* Data line */}
                <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2" />
                
                {/* Data points and labels */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                        <text x={p.x} y={height - padding + 15} textAnchor="middle" fontSize="10" fill="#6b7280">{p.date}</text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default PerformanceChart;
