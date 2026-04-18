"use client";

import { Suspense } from "react";
import SupplierFormClient from "../SupplierFormClient";

export default function AddSupplierPage() {
    return (
        <Suspense fallback={<div className="p-6 pt-20">Loading...</div>}>
            <SupplierFormClient />
        </Suspense>
    );
}
