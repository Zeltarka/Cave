import Image from "next/image";

export default function Home() {
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "70dvh",
                marginTop: "5vh",
            }}
        >
            <Image
                src="/main.jpg"
                fill
                priority
                alt={"page d'accueil"}
                style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                }}
            />
        </div>
    );
}
