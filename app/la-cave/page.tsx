"use client";
import Link from "next/link";
import {useState} from "react";

export default function page() {
    const [underline, setUnderline] = useState(false);
    const [underline1, setUnderline1] = useState(false);
    return (
        <div
        style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingLeft: '20vh',
            paddingTop:'10vh',
            paddingRight: '30vh',


        }}>
            <p style={{alignItems:'center'}}>La Cave La Garenne vous propose 800 références disponibles en boutique
                (plus de 6000 sur commandes), dont :<br/><br/>

                *       450 vins français et étrangers, plus de 200 issus de l'AB,
                biodynamie ou HVE <br/>
                *       60 Champagnes de récoltants<br/>
                *       200 Whiskies (plus de 1000 références sur commande)<br/>
                *       120 Rhums (plus de 600 rhums sur commande)<br/>
                *       30 Cognac et Armagnac, bières, cidres.<br/><br/>

                Cadeaux d'entreprise (magnums, caisses bois, grands crus, vins d'exception
                ...)<br/>
                <br/>
                Mise à disposition de Tonneaux de 5 ou 10 litres pour vos réceptions.<br/><br/>

                En lien direct avec nos vignerons partenaires, afin de maîtriser nos gammes
                de produits, nous proposons des dégustations une fois par mois durant
                l’année, animées par les producteurs vignerons, et tous les samedis de
                novembre à décembre.

                <br/><br/>

                Philosophie : « que du bon » nos vins commencent à des prix de 4 à 5 € /
                unité, passant par une gamme de vin plaisir du we, aux grands crus. Sur
                commande, nous travaillons sur des demandes personnalisées.</p>

            <div style={{color: '#24586f', display:'flex', position:'relative', justifyContent: 'right', top:'5vh', fontSize:'3vh', gap:'10vh' }}>
                <Link href="/carte-cadeau"
                      style={{ textDecoration: underline? "underline" : "none", cursor: "pointer" }}
                      onMouseEnter={() => setUnderline(true)}
                      onMouseLeave={() => setUnderline(false)}>Carte Cadeau</Link>
                <Link href="/boutique"
                      style={{ textDecoration: underline1? "underline" : "none", cursor: "pointer" }}
                      onMouseEnter={() => setUnderline1(true)}
                      onMouseLeave={() => setUnderline1(false)}>Boutique en ligne</Link>
            </div>
        </div>

    )
}