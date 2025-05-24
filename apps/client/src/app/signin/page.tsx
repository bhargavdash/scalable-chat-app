"use client"

import { OpenEye, ClosedEye } from '@repo/ui/eye'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import axios from 'axios'
import { HTTP_URL } from '../config'

export default function Signin() {
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const handleSignin = async() => {
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;

        if(!username || !password){
            alert("Incomplete credentials");
            return;
        }
        const response = await axios.post(`${HTTP_URL}/signin`, {
            username: username,
            password: password
        });

        console.log(response.data);
        localStorage.setItem("token", response.data.token)
        router.push('/lobby')
    }

    return <>
    <div className='h-screen w-screen flex justify-center items-center'>
        <div className="flex flex-col gap-4 rounded-md border border-dashed border-white p-4 w-80">
            <div className='flex justify-center items-center'>
                <p className='text-xl font-bold'>SignIn Here</p>
            </div>
            <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1'>
                    <p>Username:</p>
                    <div className='border-[1px] rounded-sm p-2'>
                        <input ref={usernameRef} className="outline-none" type="text" placeholder="Enter your username" />
                    </div>
                </div>
                <div className='flex flex-col gap-1'>
                    <p>Password:</p>
                    <div className='flex justify-between items-center border-[1px] p-2 w-full rounded-sm'>
                        <input ref={passwordRef} className="outline-none" type={`${showPassword ? "text" : "password"}`} placeholder="Enter your username" />
                        {!showPassword && <OpenEye onClick={() => setShowPassword(c => !c)} className='hover:cursor-pointer w-4' />}
                        {showPassword && <ClosedEye onClick={() => setShowPassword(c => !c)} className='hover:cursor-pointer w-4' />}
                    </div>
                    
                </div>
            </div>
            <div onClick={handleSignin}
            className="hover:cursor-pointer hover:bg-gray-600 w-full rounded-md flex justify-center items-center h-10 bg-gray-700">
                Signin
            </div>
            <div className="flex justify-center items-center gap-2">
                <p>Don&apos;t have an account ?</p>
                <p onClick={() => {
                    router.push('/signup')
                }}
                className='text-blue-400 hover:underline hover:cursor-pointer'>Signup</p>
            </div>
        </div>
    </div>
    </>
}