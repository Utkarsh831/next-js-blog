"use client";
import React, {useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation'
// @ts-ignore
import {v4 as uuidv4} from 'uuid';
import {User} from "@/app/lib/definition";
import {getSession} from "next-auth/react";

export default function Page() {
    const router = useRouter();
    const PROMPT = "You are a creative blog writer. write a 50-word blog post about the title below. You can write anything you want, but it must be at least 50 words long. The title is: "
    const [generating, setGenerating] = useState(false);
    const [content, setContent] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        content: '',
        date: new Date().toISOString().slice(0, 10)
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }))
    };

    const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        const uuid = uuidv4();
        fetch(`/api/posts?id=${uuid}&title=${formData.title}&content=${content || formData.content}&author=${user?.name}&date=${formData.date}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({...formData, id: uuid})
        }).then(() => {
            // Clear form fields
            setFormData({
                id: '',
                title: '',
                content: '',
                date: ''
            });
            router.push('/blog/posts');
        }).catch(console.error)
    }

    const generateContent = () => {
        setGenerating(true);
        if (!formData?.title) {
            return false
        }
        const requestParams = {
            model: "gpt-3.5-turbo",
            messages: [{"role": "system", "content": PROMPT + formData?.title},
                {"role": "user", "content": formData?.title},]

        }
        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify(requestParams)
        }).then(response => response.json())
            .then(data => {
                setContent(data.choices[0].message.content);
                console.log(data.choices[0].message.content);
                ;
            }).catch(console.error)
            .finally(() => {
                setGenerating(false);
            });
    }

    useEffect(() => {
        getSession().then((session) => {
            // @ts-ignore
            setUser(session?.user || null);
            if (!session?.user) {
                router.push('/blog/posts');
            }
        })
    }, []);

    const postContent = useMemo(() => {
        return content || formData.content;
    }, [content, formData.content])

    return (
        <div className="bg-white p-8 rounded shadow">
            <h2 className="text-2xl mb-4 text-emerald-700">New Blog Post</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                    <label htmlFor="title" className="block font-medium">Title:</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange}
                           className="w-full border-2 border-emerald-100 p-2 rounded-md focus:border-emerald-200 focus:outline-none"/>
                </div>
                <div>
                    <label htmlFor="content" className="block font-medium">Content:</label>
                    <textarea id="content" name="content" rows={4} value={postContent} onChange={handleChange}
                              className="w-full border-2 border-emerald-100 p-2 rounded-md focus:border-emerald-200 focus:outline-none"></textarea>
                    {generating && <p className='text-emerald-700 my-1'>Generating content...</p>}
                    <button onClick={generateContent} type="button"
                            className="bg-emerald-700 text-white px-4 py-2 rounded-md  hover:bg-emerald-700">Generate
                        Content
                    </button>
                </div>
                <div>
                    <label htmlFor="date" className="block font-medium">Date:</label>
                    <input type="text" id="date" name="date" value={formData.date} readOnly
                           className="w-full border-2 border-emerald-100 p-2 rounded-md focus:border-emerald-200 focus:outline-none"/>

                </div>
                <div>
                    <button type="submit"
                            className="outline outline-1 border-emerald-700 text-emerald-700 hover:text-white px-4 py-2 rounded-md  hover:bg-emerald-700">Submit
                    </button>
                </div>
            </form>
        </div>
    );
}
