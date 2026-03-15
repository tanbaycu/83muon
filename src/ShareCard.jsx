import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const decodeHtmlEntities = (text) => {
     if(!text) return "";
     const textarea = document.createElement("textarea");
     textarea.innerHTML = text;
     return textarea.value;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#1c1a19] flex flex-col items-center justify-center font-sans-editorial text-[#f4f2ee] select-none">
         <Loader2 className="animate-spin text-[var(--color-rust)] mb-4" size={32} />
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="font-sans-editorial uppercase tracking-[0.4em] text-[10px] md:text-sm text-white/50 flex items-center font-bold"
         >
           LOADING VENUS <span className="flex gap-1 ml-2">
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
         <h1 className="text-2xl font-serif-editorial font-bold mb-2">Không tìm thấy Thiệp</h1>
         <p className="text-[#1c1a19]/50 mb-8 max-w-sm">{error}</p>
         <button onClick={() => navigate("/")} className="px-6 py-3 bg-[#1c1a19] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#34302e] transition-colors shadow-lg active:scale-95">
           Trở về Trang chủ
         </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full relative font-sans-editorial bg-[#1c1a19] flex items-center justify-center overflow-x-hidden p-4 md:p-10 lg:p-16">
      
      {/* Absolute Backdrop Iframe */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
         <iframe src="/animated.html" className="w-full h-full border-none object-cover scale-[1.2]" title="Flowers Background" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      <button 
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 md:top-10 md:left-10 z-[60] text-white/50 hover:text-white transition-colors p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full shadow-lg border border-white/10"
        title="Quay lại danh sách"
      >
        <ArrowLeft strokeWidth={1.5} size={24} />
      </button>

      {/* Main Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-2xl relative z-10 bg-[#faf8f5]/98 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] rounded-[2rem] overflow-hidden flex flex-col md:flex-row border border-white/20"
      >
         
         {/* Top / Left Action Ribbon */}
         <div className="w-full md:w-32 bg-[#a65d57] shrink-0 flex md:flex-col justify-between items-center p-6 md:py-10 text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-black/10 translate-x-full md:translate-x-0 md:translate-y-full group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700 pointer-events-none rounded-t-[2rem] md:rounded-tr-none md:rounded-l-[2rem]" />
            
            <div className="flex flex-col items-start md:items-center relative z-10">
               <span className="font-sans-editorial text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-bold opacity-70 mb-1 [writing-mode:horizontal-tb] md:[writing-mode:vertical-rl] md:rotate-180 md:tracking-[0.5em] md:mb-6">ID THẺ MỜI</span>
               <span className="font-mono text-lg md:text-2xl font-bold tracking-widest [writing-mode:horizontal-tb] md:[writing-mode:vertical-rl] md:rotate-180 drop-shadow-sm">#83-{girlData?.stt}</span>
            </div>
            
            <motion.button 
               whileTap={{ scale: 0.9 }}
               onClick={handleCopyLink}
               className="relative z-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#a65d57] flex items-center justify-center transition-all shadow-md group border border-white/30 backdrop-blur-sm"
               title="Sao chép Link"
            >
               {copied ? <CheckCircle2 size={20} strokeWidth={2.5} /> : <LinkIcon size={18} strokeWidth={2} />}
            </motion.button>
         </div>

         {/* Content Area */}
         <div className="flex-1 p-8 md:p-12 pb-10 flex flex-col relative min-h-[500px]">
            {/* Watermark Quote */}
            <span className="absolute top-2 right-6 md:right-8 text-[8rem] md:text-[12rem] text-[#1c1a19] opacity-[0.03] font-serif-editorial leading-none pointer-events-none select-none">"</span>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-8 relative z-10">
               <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-[4px] border-white shadow-xl shrink-0 bg-[#1c1a19]/5 hidden sm:block">
                 {girlData?.imageUrl ? (
                    <img src={girlData.imageUrl} alt={girlData.name} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full bg-[#1c1a19]/10" />
                 )}
               </div>
               
               <div className="flex flex-col items-center sm:items-start text-center sm:text-left pt-2">
                 <div className="w-20 h-20 sm:hidden rounded-full overflow-hidden border-[3px] border-white shadow-lg mb-4 bg-[#1c1a19]/5 shrink-0">
                    {girlData?.imageUrl ? (
                       <img src={girlData.imageUrl} alt={girlData.name} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full bg-[#1c1a19]/10" />
                    )}
                 </div>
                 <h2 className="font-serif-editorial text-[2.5rem] md:text-[3.5rem] leading-[1] italic font-bold text-[#1c1a19] drop-shadow-sm mb-1">{girlData?.name}</h2>
                 <p className="font-sans-editorial text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-semibold text-[#a65d57]">Gương mặt / Đại diện Sắc đẹp</p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 mb-4">
               <div className="font-serif-editorial text-justify w-full">
                  <ReactMarkdown 
                     remarkPlugins={[remarkGfm]}
                     components={{
                       p: ({node, ...props}) => <p className="text-[1.3rem] md:text-[1.5rem] leading-[1.6] text-[#1c1a19]/90 mb-5" {...props} />,
                       strong: ({node, ...props}) => <strong className="font-bold text-[#a65d57]" {...props} />,
                       em: ({node, ...props}) => <em className="italic font-light" {...props} />,
                       a: ({node, ...props}) => <a className="text-[#a65d57] underline underline-offset-4 decoration-1 hover:decoration-[#a65d57] opacity-90 transition-all font-medium" target="_blank" rel="noopener noreferrer" {...props} />
                     }}
                  >
                     {decodeHtmlEntities(girlData?.wish) || defaultWish}
                  </ReactMarkdown>
               </div>
            </div>

            <div className="mt-auto pt-6 border-t border-[#1c1a19]/10 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 relative z-10">
               <span className="font-sans-editorial text-[10px] uppercase tracking-[0.3em] font-bold text-[#1c1a19]/30 hidden sm:block pt-3">DỰ ÁN VENUS • 12A4</span>
               {girlData?.signature && (
                  <div className="text-center sm:text-right w-full sm:w-auto">
                     <span className="font-serif-editorial italic text-2xl md:text-[1.8rem] font-bold text-[#a65d57] inline-block">
                        — {girlData.signature}
                     </span>
                  </div>
               )}
            </div>

         </div>
      </motion.div>
      
      {copied && (
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.9 }}
           className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-white text-[#1c1a19] px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-[#1c1a19]/5"
         >
           <CheckCircle2 size={16} className="text-green-600" /> Đã chép Link Thiệp!
         </motion.div>
      )}

    </div>
  );
}
