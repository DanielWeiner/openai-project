'use client';

import { Message } from "@/app/conversation";
import { MutableRefObject, useEffect, useRef, useState } from "react";

const ChatBubble = ({ role, children } : { children: React.ReactNode, role: string }) => {
    return (
        <div className={`w-full mt-4 flex flex-col border-t border-t-slate-400 first:mt-0 first:border-0 px-4 border-opacity-50 ${role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-2 whitespace-pre-wrap relative mt-4 rounded-md shadow-sm ring-gray-300 w-fit ${role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-50 text-slate-900'}`}>
                <h4 className={`text-xs py-1 ${
                    role === 'user' ? 'text-gray-100' : 'text-gray-500'
                }`}>{role === 'user' ? 'You' : 'Boss' }</h4>
                <p>{children}</p>
            </div>
        </div>
        
    );
}

export default function ChatBox({ conversationId, initialChatLog } : { conversationId: string, initialChatLog: Message[]}) {
    const [ text, setText ] = useState("");
    const [ chatContents, setChatContents ] = useState("");
    const [ chatId, setChatId ] = useState("");
    const [ eventSource, setEventSource ] = useState<EventSource | null>(null);

    const chatResponseRef = useRef("");
    const chatLogRef = useRef(initialChatLog);
    const [ chatResponse, setChatResponse ] = useState("");
    const [ chatLog, setChatLog ] = useState(initialChatLog);
    const scroller = useRef(null) as MutableRefObject<HTMLDivElement | null>;

    useEffect(() => {
        if (!chatContents) return;
        setChatContents("");
        chatLogRef.current = [...chatLogRef.current, { role: 'user', content: chatContents }];
        setChatLog(chatLogRef.current);
        setText("");

        (async () => {
            const response = await fetch(`/api/conversation/${conversationId}/chat`, {
                method: "POST",
                body: JSON.stringify(chatContents)
            });
            
            chatResponseRef.current = "";
            setChatResponse("");
            setChatId(await response.json());
        })();
    }, [ conversationId, chatContents, setChatId, setChatContents, chatResponseRef, setChatResponse, chatLog, setChatLog ]);

    useEffect(() => {
        if (!chatId) return;
        if (!eventSource) {
            const newEventSource = new EventSource(`/api/conversation/${conversationId}/chat/${chatId}`);
            
            const end = () => {
                chatLogRef.current = [ ...chatLogRef.current, { role: 'assistant', content: chatResponseRef.current } ];
                newEventSource.close();
                setChatId(""); 
                setEventSource(null);
                setChatLog(chatLogRef.current);
                setChatResponse("");
            };
            
            const eventListener = (event: MessageEvent) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.choices[0].finish_reason) {
                        return end();
                    }
                    chatResponseRef.current += data.choices[0].delta.content || "";
                    setChatResponse(chatResponseRef.current);
                } catch(e) {
                    console.error(e);
                    return end();
                }
            };

            newEventSource.addEventListener('message', eventListener);
            setEventSource(newEventSource);
            return;
        }
    }, [ conversationId, chatId, setChatId, eventSource, setEventSource, chatResponseRef, setChatResponse, chatLog, setChatLog ]);

    useEffect(() => {
        scroller.current?.scrollTo(0, 999999999);
    }, [scroller, chatLog, chatResponse])

    return (
        <section className="flex flex-col w-6/12 max-h-full h-full">
            <h2 className="text-2xl text-slate-700 font-bold text-center py-2">Talk to a Mob Boss</h2>
            <div className="rounded-sm flex-grow overflow-hidden flex flex-col shadow-md" style={{
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0
                }}>
                <div ref={scroller} className="max-h-full flex-1 shadow-inner overflow-y-scroll flex-grow scrollbar-thumb-slate-500 scrollbar-track-slate-300 scrollbar-thin">
                    <div className={`flex flex-col flex-grow py-1 min-h-full justify-end shadow-lg bg-slate-200 pb-3 ${chatLog.length === 0 && !chatResponse ? 'justify-center' : 'justify-end' }`}>
                        {
                            chatLog.length === 0 && !chatResponse ? <p className="text-center text-gray-500 justify-self-center">
                                Say something to the boss, and make it quick.<br/> Don&apos;t forget to address him as &quot;boss&quot;.
                            </p> : null
                        }

                        {chatLog.map(({ content, role }, i) => <ChatBubble role={role} key={i}>{content}</ChatBubble>)}
                        {chatResponse ? <ChatBubble role="assistant" key={chatLog.length}>{chatResponse}</ChatBubble> : null}
                    </div>
                </div>
            </div>
            <form className="flex-grow-0 flex-shrink-1 pb-4"
                onSubmit={ 
                    (e) => {
                        e.preventDefault();
                        if (!eventSource) { setChatContents(text); }
                    } 
                }>
                <div className="relative rounded-md shadow-md">
                    <input 
                        type="text"
                        className="block h-12 text-md w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600" 
                        style={{
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0
                        }}
                        value={ text }
                        placeholder="Say something..."
                        onChange={ input => setText(input.target.value) }/>
                </div>
            </form>
        </section>
        
    )
}