import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import anime from 'animejs';
import { Loader2, ArrowLeft, Link as LinkIcon, CheckCircle2, QrCode } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { defaultWish } from './members';

export default function ShareCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [girlData, setGirlData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Không cung cấp mã định danh hợp lệ.");
        setIsLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'girls', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setGirlData({ stt: id, ...docSnap.data() });
        } else {
          setError("Tấm thiệp này không tồn tại hoặc đã bị xóa.");
        }
      } catch (err) {
        console.error(err);
        setError("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      }
      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  const hashCode = useMemo(() => {
    if(!girlData) return 'A000';
    let hash = 0;
    const str = girlData.name + girlData.stt;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().substring(0, 5);
  }, [girlData]);

  const shareUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied('link');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(`83-${girlData?.stt}-${hashCode}`);
    setCopied('hash');
    setTimeout(() => setCopied(false), 3000);
  };

  const decodeHtmlEntities = (text) => {
     if(!text) return "";
     const textarea = document.createElement("textarea");
     textarea.innerHTML = text;
     return textarea.value;
  };

  const handleOpenCard = () => {
      if (isOpen) return;
      setIsOpen(true);

      const tl = anime.timeline({
          easing: 'easeOutExpo',
          duration: 1500
      });

      tl.add({
          targets: '.door-left',
          rotateY: -130, // Mở cửa trái (Swing Left)
      })
      .add({
          targets: '.door-right',
          rotateY: 130, // Mở cửa phải (Swing Right)
      }, 0)
      .add({
          targets: '.content-panel',
          scale: [0.95, 1],
          opacity: [0.5, 1],
          boxShadow: ['0px 0px 0px rgba(0,0,0,0)', '0px 30px 60px rgba(0,0,0,0.15)']
      }, 200)
      .add({
          targets: '.tap-hint',
          opacity: 0,
          duration: 300
      }, 0);
  };


  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#1c1a19] flex flex-col items-center justify-center font-sans-editorial text-[#f4f2ee] select-none">
         <Loader2 className="animate-spin text-[var(--color-rust)] mb-4" size={32} />
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-sans-editorial uppercase tracking-[0.4em] text-[10px] md:text-sm text-white/50 flex items-center font-bold">
           DECODING VENUS ID <span className="flex gap-1 ml-2">
              <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}>.</motion.span>
              <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}>.</motion.span>
              <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}>.</motion.span>
           </span>
         </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#faf8f5] flex flex-col items-center justify-center font-sans-editorial text-[#1c1a19] px-6 text-center">
         <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
         </div>
         <h1 className="text-2xl font-serif-editorial font-bold mb-2">Truy xuất thất bại</h1>
         <p className="text-[#1c1a19]/50 mb-8 max-w-sm">{error}</p>
         <button onClick={() => navigate("/")} className="px-6 py-3 bg-[#1c1a19] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#34302e] transition-colors shadow-lg active:scale-95">
           Trở về Trang chủ
         </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full relative font-sans-editorial bg-[#1c1a19] flex items-center justify-center overflow-x-hidden p-4 md:p-10 py-20 pb-safe perspective-[2000px]">
      
      {/* Background Animated iframe & Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
         <iframe src="/animated1.html" className="w-full h-full border-none object-cover scale-[1.2]" title="Flowers Background" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#1c1a19] via-[#1c1a19]/80 to-[#1c1a19]/40" />
      </div>

      <button 
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 md:top-10 md:left-10 z-[60] text-white/50 hover:text-[#a65d57] transition-all p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full shadow-lg border border-white/10 group"
        title="Quay lại danh sách"
      >
        <ArrowLeft strokeWidth={1.5} size={24} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* GATEFOLD CARD CONTAINER */}
      <div className="card-container w-[90vw] md:w-[600px] h-[75vh] md:h-[600px] max-h-[800px] relative z-10 [perspective:2000px] mx-auto mt-0 lg:mt-4 shadow-2xl">
          
          {/* MẶT TRONG THIỆP (Nội dung) */}
          <div className="content-panel absolute inset-0 bg-[#faf8f5] rounded-3xl flex flex-col p-6 md:p-10 opacity-60 scale-95 border border-[#1c1a19]/10 [transform-style:preserve-3d]">
              <div className="w-full border-b border-[var(--color-rust)]/20 pb-4 mb-6 flex justify-between items-end relative z-10">
                  <div>
                     <span className="font-sans-editorial text-[9px] uppercase tracking-[0.2em] font-bold text-[#a65d57]">Gửi tới</span>
                     <h2 className="font-serif-editorial text-[1.8rem] md:text-4xl font-bold text-[#1c1a19] leading-none mt-1">{girlData?.name}</h2>
                  </div>
                  <div className="font-mono text-[10px] md:text-sm text-[#1c1a19]/40 tracking-widest text-right">
                     ID: {girlData?.stt}<br/>
                     <span className="opacity-50 text-[8px] md:text-[10px]">VERIFIED CA</span>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar font-serif-editorial text-base md:text-lg text-justify text-[#1c1a19]/80 pr-4 relative">
                 <div className="fixed top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] text-[20rem] leading-none pointer-events-none font-serif-editorial select-none">"</div>
                 
                 <ReactMarkdown 
                     remarkPlugins={[remarkGfm]}
                     components={{
                       p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                       strong: ({node, ...props}) => <strong className="font-bold text-[#a65d57]" {...props} />,
                       em: ({node, ...props}) => <em className="italic font-light" {...props} />,
                     }}
                 >
                     {decodeHtmlEntities(girlData?.wish) || defaultWish}
                 </ReactMarkdown>

                 <div className="mt-8 text-right italic font-bold text-[#a65d57] text-xl md:text-2xl pb-4">
                     — {girlData?.signature || 'Project Venus'}
                 </div>
              </div>
          </div>

          {/* 2 CÁNH CỬA (Doors) */}
          <div className="absolute inset-0 flex [transform-style:preserve-3d] shadow-2xl rounded-3xl pointer-events-none">
              
              {/* Tap Hint */}
              <div className="tap-hint absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                 <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full animate-fadeIn mt-64 shadow-lg">
                    <span className="font-sans-editorial text-xs tracking-[0.3em] font-bold text-white uppercase drop-shadow">Tap to Open</span>
                 </div>
              </div>

              {/* LEFT DOOR */}
              <div className="door-left relative w-1/2 h-full origin-left [transform-style:preserve-3d] z-20 cursor-pointer pointer-events-auto" onClick={handleOpenCard}>
                   
                   {/* Inside Left (Backface) */}
                   <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-[#1c1a19] to-[#2a2624] rounded-l-3xl border-y border-l border-white/10 p-4 md:p-8 flex flex-col items-center justify-between text-white drop-shadow-2xl">
                       <span className="font-sans-editorial text-[8px] md:text-[10px] tracking-widest text-[#a65d57] uppercase">Venus Intl</span>
                       <div className="flex flex-col items-center w-full">
                           <div className="text-white/40 italic font-serif-editorial text-lg md:text-xl mb-4 text-center">Scan to Capture</div>
                           <div className="bg-white p-2 md:p-3 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-500">
                               {/* Dynamic QuickChart.io QR generation */}
                               <img src={`https://quickchart.io/qr?text=${encodeURIComponent(shareUrl)}&size=300&light=ffffff&dark=1c1a19&margin=1`} alt="QR Code" className="w-20 h-20 md:w-32 md:h-32 object-contain" />
                           </div>
                           <span className="font-mono text-[9px] md:text-[11px] text-white/30 tracking-[0.3em] uppercase mt-6 text-center">
                              #{hashCode}
                           </span>
                       </div>
                       <QrCode size={16} className="text-white/10" />
                   </div>

                   {/* Outside Left (Frontface) */}
                   <div className="absolute inset-0 [backface-visibility:hidden] rounded-l-3xl overflow-hidden shadow-[20px_0_30px_rgba(0,0,0,0.5)] bg-[#1c1a19] flex flex-col items-center justify-between p-6 md:p-10 border-r border-[#faf8f5]/10">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#a65d57]/20 border-r border-[#a65d57] to-transparent opacity-50 z-0"></div>
                        <div className="w-full flex justify-start relative z-10">
                            <span className="font-sans-editorial text-[8px] md:text-[10px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl] rotate-180">
                                Project Venus • 12A4
                            </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center w-full relative z-10">
                            <h2 className="font-serif-editorial text-[#faf8f5] text-5xl md:text-7xl italic opacity-90 -rotate-90 whitespace-nowrap drop-shadow-lg">
                                Vol. 1
                            </h2>
                        </div>
                        <div className="w-full flex justify-end relative z-10">
                             <div className="w-8 h-[1px] bg-[#a65d57]"></div>
                        </div>
                   </div>
              </div>

              {/* RIGHT DOOR */}
              <div className="door-right relative w-1/2 h-full origin-right [transform-style:preserve-3d] z-20 cursor-pointer pointer-events-auto border-l-0" onClick={handleOpenCard}>
                   
                   {/* Inside Right (Backface) */}
                   <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-tr from-[#1c1a19] to-[#2a2624] rounded-r-3xl border-y border-r border-white/10 p-6 flex flex-col justify-end text-right drop-shadow-2xl overflow-hidden">
                       <div className="opacity-[0.02] text-[15rem] font-serif-editorial absolute bottom-[-5rem] right-[-2rem] leading-none pointer-events-none">V</div>
                       <h3 className="font-serif-editorial text-[#a65d57] text-2xl md:text-4xl italic">Project Venus</h3>
                       <p className="font-sans-editorial text-[9px] md:text-[11px] text-white/40 tracking-[0.3em] mt-2 uppercase">Volume 1.0<br/>Class of 12A4</p>
                   </div>

                   {/* Outside Right (Frontface) */}
                   <div className="absolute inset-0 [backface-visibility:hidden] rounded-r-3xl overflow-hidden shadow-[-10px_0_20px_rgba(0,0,0,0.3)] bg-[#1c1a19] flex flex-col items-center justify-center p-4 md:p-8">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[#a65d57]/10 blur-[60px] rounded-full pointer-events-none z-0"></div>
                        <div className="relative z-10 w-24 h-24 md:w-36 md:h-36 rounded-full border-[2px] md:border-[3px] border-[#a65d57]/80 shadow-[0_10px_30px_rgba(166,93,87,0.3)] overflow-hidden mb-6 group transition-all duration-700 hover:scale-105">
                            {girlData?.imageUrl ? (
                                <img src={girlData.imageUrl} alt={girlData.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full bg-white/5" />
                            )}
                        </div>
                        <h2 className="relative z-10 font-serif-editorial text-2xl md:text-3xl lg:text-4xl text-[#faf8f5] font-bold text-center leading-tight mb-2 drop-shadow-md">
                            {girlData?.name}
                        </h2>
                        <div className="relative z-10 font-sans-editorial text-[8px] md:text-[10px] tracking-[0.4em] uppercase text-[#a65d57] text-center font-bold">
                            Mã Định Danh: {girlData?.stt}
                        </div>
                   </div>
              </div>

          </div>
      </div>

      {/* Floating Action Bar (Appears when opened) */}
      <div className={`fixed bottom-6 md:bottom-10 left-0 w-full flex flex-wrap justify-center gap-3 md:gap-6 z-50 transition-all duration-1000 px-4 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
         <button onClick={handleCopyLink} className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-[#1c1a19]/80 backdrop-blur-xl text-white rounded-full px-6 py-4 font-sans-editorial uppercase tracking-widest text-[9px] md:text-[11px] font-bold shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:bg-[#a65d57] transition-all border border-white/20 active:scale-95">
             {copied === 'link' ? <CheckCircle2 size={16} className="text-green-400" /> : <LinkIcon size={16} />}
             {copied === 'link' ? 'Đã sao chép' : 'Sao chép Link'}
         </button>
         <button onClick={handleCopyHash} className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-white/10 backdrop-blur-xl text-white rounded-full px-6 py-4 font-sans-editorial uppercase tracking-widest text-[9px] md:text-[11px] font-bold shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:bg-white/20 transition-all border border-white/20 active:scale-95">
             {copied === 'hash' ? <CheckCircle2 size={16} className="text-green-400" /> : <span className="font-mono pt-[1px] opacity-70">#</span>}
             {copied === 'hash' ? 'Đã sao chép' : 'Copy Mã Hash'}
         </button>
      </div>

    </div>
  );
}
