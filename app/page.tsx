import Image from "next/image";

export default function Home() {
    return (
        <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] mt-4 sm:mt-8 md:mt-12">
            <Image
                src="/main.jpg"
                fill
                priority
                alt="La Cave - Caviste à La Garenne-Colombes"
                className="object-cover object-[center_top]"
                sizes="100vw"
            />
        </div>
    );
}