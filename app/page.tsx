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
                alt="page d'accueil"
                style={{
                    objectFit: "cover",
                    objectPosition: "center top",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#fff",
                    textAlign: "center",
                    width: "90%",
                    fontSize: "clamp(1.5rem, 4vw, 3rem)",
                    fontWeight: "bold",
                }}
            >

            </div>
        </div>
    );
}
