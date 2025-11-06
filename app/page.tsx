"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";


export default function Home() {
    const [mousePos, setMousePos] = useState({ x: -200, y: -200 });

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "70vh",
                marginTop: "5vh",
                marginBottom: "auto",

            }}
        >
            <Image
                src="/main.jpeg"
                fill
                alt={"boutique"}
                style={{
                    objectFit: "cover",
                }}

            />
        </div>
    );
}
