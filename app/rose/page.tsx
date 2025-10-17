"use client";
import Link from "next/link";
import {useState} from "react";

export default function page() {
    const[quantiter, setquantiter] = useState(1);
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const quantiter = parseInt(event.target.value);
        if (!isNaN(quantiter) && quantiter >= 0) {
            setquantiter(quantiter);
        }else{
            setquantiter(1);
        }
    }

    const augmenter = () => setquantiter((q) => q + 1);
    const diminuer = () => setquantiter((q) => Math.max(0, q - 1));

    return(
        <div style={{
            display: 'flex',
            textAlign: 'left',
        }}>
            <Link href="/boutique">
                <p style={{color:'black', fontSize:'17px',position:'absolute', top:'155px',left:'30px'}}>←Nos Produits</p>
            </Link>
            <a style={{
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundImage: 'url("champagne.jpg")',
                border: '1px solid #24586f',
                width: '400px',
                height: '600px',
                borderRadius: '20px',
                position: 'absolute',
                left:'200px',
                top: '200px',

            }}>
            </a>

            <div style={{
                display: 'flex',
                textAlign: 'left',
                position: 'absolute',
                left:'750px',
                top:'250px',
                color:'#24586f',
            }}>
                <h1 style={{fontSize:'30px'}}>Champagne La Cave</h1>

                <p style={{fontSize:'18px', position:'absolute', left:'25px', top:'100px', color:'black'}}>"Descritpion produit"</p>

                <button style={{
                    width: '170px',
                    height: '70px',
                    left:'100px',
                    top:'400px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexDirection: 'row',
                    display: 'flex',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundColor:'#8ba9b7',
                    border: '1px solid #24586f',
                    borderRadius: '20px',
                    position: 'absolute',
                    color:'white'
                }}>Ajouter au panier</button>


                <div style={{
                    top:'300px',
                    width:'300px',
                    height:'70px',
                    display: 'flex',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundColor:'white',
                    border: '1px solid #24586f',
                    borderRadius: '20px',
                    position: 'absolute',
                    left:'10px',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap:'10px',
                    marginTop:'20px',
                    marginBottom:'20px',
                    marginRight:'20px',
                    marginLeft:'20px',

                }}>
                    <label htmlFor="quantiter" style={{fontSize:'18px'}}>Quantité: </label>

                    <input
                        id="quantiter"
                        type="number"
                        value={quantiter}
                        onChange={handleChange}
                        min="0"
                        style={{
                            width: "100px",
                            height: "25px",
                            fontSize: "18px",
                            textAlign: "center",
                            borderRadius: "6px",
                            border: "1px solid #8ba9b7",
                        }}
                    />
                </div>


            </div>

        </div>

    );
}
