export default function Page() {
    return (
        <div className="flex flex-col justify-start px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 py-8 sm:py-12 lg:py-16 text-black max-w-6xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-[#24586f] font-semibold mb-6 sm:mb-8 text-center lg:text-left">
                Notre Histoire
            </h1>

            <div className="text-base sm:text-lg leading-relaxed space-y-4 sm:space-y-5">
                <p>
                    La Cave La Garenne est née en juin 2017. C'est une entreprise indépendante.
                </p>

                <p>
                    Ancien militaire de l'Armée de l'Air, Gilles Pottier est devenu développeur d'entreprises dans
                    les métiers de l'aéronautique, spatial et défense, et l'industrie de pointe. Après 20 ans
                    d'activité, où il agit en tant que Directeur de projet mission conseil, il choisit de monter sa
                    propre entreprise…dans le vin!
                </p>

                <p>
                    Au vu de l'activité, il s'est vite entouré en 2019 d'une succession de Chef Sommelier
                    expérimenté, notamment dans des restaurants étoilés.
                    La gamme de vin se veut très équilibrée en termes de prix et de qualité. On commence entre
                    5 et 10 € sur chaque Région.
                </p>

                <p>
                    L'attention particulière est réalisée dans la sélection des produits. «Ce qui m'importe c'est ce
                    qu'il y a dans le verre, plus que l'année, et plus que la renommée du domaine! » Même si le
                    cru et l'année «racontent et expliquent » beaucoup de chose.
                </p>

                <p>
                    La Cave la Garenne fournit autant ses clients particuliers (B to C) que des entreprises (B to B).<br />
                    La Cave La Garenne réalise un véritable travaille de sommellerie (accord met / vin), avec un
                    conseil dédié à chaque client, à chaque instant de l'année.
                </p>

                <p className="font-semibold text-[#24586f] text-lg sm:text-xl pt-2">
                    Avec joie de vous recevoir à La Cave La Garenne!
                </p>
            </div>
        </div>
    );
}