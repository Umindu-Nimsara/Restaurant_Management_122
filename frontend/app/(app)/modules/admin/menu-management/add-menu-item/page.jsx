"use client";

import React, { Suspense } from "react";
import AddMenuItemClient from "./AddMenuItemClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6 pt-20">Loading...</div>}>
            <AddMenuItemClient />
        </Suspense>
    );
}