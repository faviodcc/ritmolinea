import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
export function Field({label,hint,...props}:InputHTMLAttributes<HTMLInputElement>&{label:string;hint?:string}){return <label className="field"><span>{label}</span><input {...props}/>{hint&&<small>{hint}</small>}</label>}
export function SelectField({label,children,...props}:SelectHTMLAttributes<HTMLSelectElement>&{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span><select {...props}>{children}</select></label>}
