"use client"

import { OpenEye, ClosedEye } from '@repo/ui/eye'
import { useEffect, useRef, useState } from 'react'
import { GreenTick } from '@repo/ui/greenTick'
import { RedCross } from '@repo/ui/redCross'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { HTTP_URL } from '../config'

export default function Signup() {
    const [showPassword, setShowPassword] = useState(false)
    const nameRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    
    const [confirmPassword, setConfirmPassword] = useState('')
    const [correctPassword, setCorrectPassword] = useState(false)

    const router = useRouter()

    useEffect(() => {
        if(passwordRef.current?.value === '') return;

        // match the passwords
        const password = passwordRef.current?.value;
        setCorrectPassword(password === confirmPassword)

    }, [confirmPassword])

    const handleSignup = async() => {
        const name = nameRef.current?.value;
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;

        if(!name || !username || !password){
            alert("Incomplete credentials")
            return;
        }
        if(!correctPassword){
            alert("Password and confirm password don't match!!");
            return;
        }

        // do backend call
        const response = await axios.post(`${HTTP_URL}/signup`, {
            username: username,
            password: password,
            name: name
        })

        console.log(response.data)
    }

    console.log("Password: ", passwordRef.current?.value);
    console.log("Confirm Password: ", confirmPassword)
    console.log("Correct Password: ", correctPassword)
    return <>
    <div className='h-screen w-screen flex justify-center items-center'>
        <div className="flex flex-col gap-4 rounded-md border border-dashed border-white p-4 w-80">
            <div className='flex justify-center items-center'>
                <p className='text-xl font-bold'>SignUp Here</p>
            </div>
            <div className='flex flex-col gap-3'>
                <div className='flex flex-col gap-1'>
                    <p>Name:</p>
                    <div className='border-[1px] p-2 rounded-sm'>
                        <input ref={nameRef} className="outline-none" type="text" placeholder="Enter your name" />
                    </div>
                </div>
                <div className='flex flex-col gap-1'>
                    <p>Username:</p>
                    <div className='border-[1px] p-2 rounded-sm'>
                        <input ref={usernameRef} className="outline-none" type="text" placeholder="Enter your username" />
                    </div>
                </div>
                <div className='flex flex-col gap-1'>
                    <p>Password:</p>
                    <div className='flex justify-between items-center w-full border-[1px] p-2 rounded-sm'>
                        <input ref={passwordRef} className="outline-none" type={`${showPassword ? "text" : "password"}`} placeholder="Enter your username" />
                        {!showPassword && <OpenEye onClick={() => setShowPassword(c => !c)} className='hover:cursor-pointer w-4' />}
                        {showPassword && <ClosedEye onClick={() => setShowPassword(c => !c)} className='hover:cursor-pointer w-4' />}
                    </div> 
                </div>
                <div className='flex flex-col gap-1'>
                    <p>Confirm Password:</p>
                    <div className='flex justify-between items-center w-full border-[1px] p-2 rounded-sm'>
                        <input onChange={(e) => setConfirmPassword(e.target.value)}
                     className="outline-none" type='password' placeholder="Enter your username" />
                        {correctPassword && <GreenTick className='w-4' />}
                        {(confirmPassword.length !== 0) && (!correctPassword) && <RedCross className='w-3' />}
                    </div>
                    
                </div>
            </div>
            <div onClick={handleSignup}
            className="hover:cursor-pointer hover:bg-gray-600 w-full rounded-md flex justify-center items-center h-10 bg-gray-700">
                SignUp
            </div>
            <div className="flex justify-center items-center gap-2">
                <p>Already have an account ?</p>
                <p onClick={() => {
                    router.push('/signin')
                }}
                className='text-blue-400 hover:underline hover:cursor-pointer'>Signin</p>
            </div>
        </div>
    </div>
    </>
}