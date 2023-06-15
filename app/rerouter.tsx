'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { v4 as uuid } from 'uuid'

export default function ReRouter() {
    const router = useRouter();
    useEffect(() => {
        router.push(`/conversation/${uuid()}`);
    }, [ router ]);

    return <></>
}