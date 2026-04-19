"use client";

import { Suspense } from "react";
import InventoryFormClient from "./InventoryFormClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="">Loading...</div>}>
            <InventoryFormClient />
        </Suspense>
    );
}