"use client";

import React from "react";

export default function DividerWithText({ text }) {
    return (
        <div className="flex items-center my-3">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
            <span className="px-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {text}
            </span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
        </div>
    );
}