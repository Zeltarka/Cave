"use client"
import Image from "next/image";

export default function page(){
    return(
        <div style={{ display:'flex',alignItems:'center', justifyContent:'center', padding:'5vh'}}><Image
            src={'/calendrier-degustations.png'} width={600} height={0} alt={""}  /></div>
    );
}
