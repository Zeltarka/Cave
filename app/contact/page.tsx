"use client"
import Link from "next/link"
export default function page(){
    return(
        <div style={{
            display: 'flex',
            flexDirection: 'column',

        }}>
            <div style={{
                display:'flex',
                marginTop:'50px',
                fontSize: '40px',
                color: '#24586f',
                justifyContent: 'center',
            }}>
                <h1>Contacts</h1>
            </div>
                <div style={{
                    color:'black',
                    display:'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontSize: '18px',
                    gap:'20px',
                    marginLeft:'25%',
                    marginTop:'50px',
                }}>
                    <div style={{flexDirection:'column', justifyContent:'space-between', gap:'25px'}}>
                        <p>Adresse - 3 rue Voltaire | 92250  La Garenne-Colombes</p>
                        <p>Télephone - 01 47 84 57 63</p>
                        <p>Adresse Mail - boutique@lacavelagarenne.fr</p>
                        <p>Horaires :</p>
                        <div style={{marginLeft:'40px'}}><p>Lundi : 10:00 - 13:30 | 14:30 - 19:30 <br/>Mardi : 10:00 - 13:30 | 14:30 - 19:30
                        <br/>Mercredi : 09:30 - 13:30 | 14:30 - 20:00<br/>Jeudi : 09:30 - 13:30 | 14:30 - 20:00<br/>Vendredi : 09:30 - 13:30 | 14:30 - 20:00<br/>Samedi : 09:00 - 13:30 | 14:00 - 20:<br/>Dimanche : fermé</p>
                        </div>
                    </div>
                    <div style={{ flexDirection: 'row', display:'flex', gap:'5px' }}>
                        <p>Laissez votre avis sur </p>
                        <Link href='https://g.page/r/CStRbN57HWnJEBM/review' target="_blank" style={{textDecoration:'underline', cursor:'pointer', color:'#24586f'}}>Google</Link>
                    </div>
                    <div style={{flexDirection:'row', display:'flex', gap:'15px',  }}> <p >Nos réseaux : </p>
                        <div style={{textDecoration:'underline', cursor:'pointer', color:'#24586f', gap:'15px', display:'flex', justifyContent:'center', alignItems:'center'}}>
                        <Link href={'https://www.linkedin.com/company/lacavelagarenne/posts/?feedView=all'}>Linkedin</Link>
                        <Link href={'https://www.instagram.com/la_cave_la_garenne/'}>Instagram</Link>
                        </div>
                    </div>
                </div>
        </div>
    );
}