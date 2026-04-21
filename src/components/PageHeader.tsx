"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
}

export default function PageHeader({ title, icon }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden shrink-0" style={{ background: "linear-gradient(135deg, #C94F78 0%, #A83E60 60%, #8B2E4E 100%)" }}>
      {/* Decorative wave blobs */}
      <div
        className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-10 -left-4 w-40 h-40 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-2 right-16 w-24 h-24 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #FFB3D1 0%, transparent 70%)" }}
      />

      {/* Wave SVG at bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 500 30"
        preserveAspectRatio="none"
        style={{ height: "28px" }}
      >
        <path
          d="M0,20 C80,0 180,35 280,15 C380,-5 430,25 500,10 L500,30 L0,30 Z"
          fill="white"
          fillOpacity="0.12"
        />
        <path
          d="M0,25 C100,8 200,35 340,20 C420,10 470,28 500,18 L500,30 L0,30 Z"
          fill="white"
          fillOpacity="0.08"
        />
      </svg>

      <div className="relative z-10 px-6 py-5 flex items-center justify-center gap-3">
        {icon && (
          <div className="text-white/90">
            {icon}
          </div>
        )}
        <h1 className="text-xl font-extrabold text-white tracking-wide drop-shadow-sm">
          {title}
        </h1>
      </div>
    </div>
  );
}
