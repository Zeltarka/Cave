"use client";
import Link from "next/link";

export default function Page() {
    return (
        <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            <div className="flex justify-center mb-8 sm:mb-12">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl text-[#24586f] font-semibold">
                    Contacts
                </h1>
            </div>

            <div className="text-black flex flex-col gap-6 sm:gap-8 max-w-3xl mx-auto w-full lg:ml-[15%] lg:mr-auto text-base sm:text-lg">
                <div className="space-y-3 sm:space-y-4">
                    <p>
                        <span className="font-semibold">Adresse</span> - 3 rue Voltaire | 92250 La Garenne-Colombes
                    </p>
                    <p>
                        <span className="font-semibold">Téléphone</span> - 01 47 84 57 63
                    </p>
                    <p>
                        <span className="font-semibold">Adresse Mail</span> - boutique@lacavelagarenne.fr
                    </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    <p className="font-semibold">Horaires :</p>
                    <div className="ml-4 sm:ml-8 overflow-x-auto">
                        <div className="inline-block min-w-full sm:min-w-0">
                            <div className="grid grid-cols-[100px_auto_auto] sm:grid-cols-[120px_120px_150px] gap-y-2 gap-x-3 sm:gap-x-4 text-sm sm:text-base">
                                <div className="font-medium">Lundi</div>
                                <div>10:00 - 13:30</div>
                                <div>14:30 - 19:30</div>

                                <div className="font-medium">Mardi</div>
                                <div>10:00 - 13:30</div>
                                <div>14:30 - 19:30</div>

                                <div className="font-medium">Mercredi</div>
                                <div>09:30 - 13:30</div>
                                <div>14:30 - 20:00</div>

                                <div className="font-medium">Jeudi</div>
                                <div>09:30 - 13:30</div>
                                <div>14:30 - 20:00</div>

                                <div className="font-medium">Vendredi</div>
                                <div>09:30 - 13:30</div>
                                <div>14:30 - 20:00</div>

                                <div className="font-medium">Samedi</div>
                                <div>09:00 - 13:30</div>
                                <div>14:00 - 20:00</div>

                                <div className="font-medium">Dimanche</div>
                                <div className="col-span-2">Fermé</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-baseline gap-1">
                    <p>Laissez votre avis sur</p>
                    <Link
                        href="https://g.page/r/CStRbN57HWnJEBM/review"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-[#24586f] hover:opacity-80 transition-opacity"
                    >
                        Google
                    </Link>
                </div>

                <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
                    <p>Nos réseaux :</p>
                    <div className="flex gap-3 sm:gap-4 underline text-[#24586f]">
                        <Link
                            href="https://www.linkedin.com/company/lacavelagarenne/posts/?feedView=all"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:opacity-80 transition-opacity"
                        >
                            Linkedin
                        </Link>
                        <Link
                            href="https://www.instagram.com/la_cave_la_garenne/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:opacity-80 transition-opacity"
                        >
                            Instagram
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}