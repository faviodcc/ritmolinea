import Link from 'next/link';
export function Logo({compact=false}:{compact?:boolean}){return <Link href="/" className="logo"><span className="logoMark"><i/><i/><i/><i/></span>{!compact&&<span>Ritmo<span>Línea</span></span>}</Link>}
