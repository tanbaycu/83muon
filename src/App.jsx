import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import anime from 'animejs';
import { ArrowLeft, ChevronUp, QrCode } from 'lucide-react';
import { Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import SystemRemits from './SystemRemits';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const defaultWish = "Chúc bạn một ngày 8/3 thật ý nghĩa, xinh đẹp và luôn hạnh phúc!";
import ShareCard from './ShareCard';

// --- COMPONENT: Circular Text SVG + Avatar ---
const AvatarWithCircularText = ({ text, imgSrc }) => {
  return (
    <div className="relative w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 shrink-0 flex items-center justify-center">
      <div className="absolute w-[60%] h-[60%] rounded-full overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-[var(--color-charcoal)]/5 z-10 border-[1.5px] border-[var(--color-oatmeal)]">
         {imgSrc ? (
           <img src={imgSrc} className="w-full h-full object-cover pointer-events-none" alt="Avatar" />
         ) : (
           <div className="w-full h-full bg-[var(--color-charcoal)]/10" />
         )}
      </div>
      <div className="absolute inset-0 animate-[spin_12s_linear_infinite] pointer-events-none z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <path id="circlePath" fill="none" d="M 50, 50 m -40, 0 a 40,40 0 0,1 80,0 a 40,40 0 0,1 -80,0" />
          <text className="text-[10.5px] font-sans-editorial tracking-[0.25em] uppercase fill-[var(--color-charcoal)]">
            <textPath href="#circlePath" startOffset="0%">{text}</textPath>
          </text>
        </svg>
      </div>
    </div>
  );
};

// --- COMPONENT: Editorial Marquee ---
const EditorialMarquee = ({ direction = "left", text }) => {
  return (
    <div className="w-full overflow-hidden flex border-y border-[var(--color-charcoal)]/10 py-3 bg-[var(--color-oatmeal)] shrink-0">
      <div className={`flex items-center gap-8 text-[11px] md:text-sm font-sans-editorial uppercase tracking-[0.3em] text-[var(--color-charcoal)]/60 ${direction === 'left' ? 'animate-marquee-l' : 'animate-marquee-r'}`}>
        {Array(10).fill(0).map((_, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap">
             {text} <span className="w-8 h-[1px] bg-[var(--color-charcoal)]/20" />
          </span>
        ))}
      </div>
    </div>
  );
};

// --- COMPONENT: Messy Path Drawing Loading ---
const LoadingSVG = () => {
  const [svgContent, setSvgContent] = useState('');
  const svgRef = useRef(null);

  useEffect(() => {
    fetch('/loadingv1.svg')
      .then(res => res.text())
      .then(text => setSvgContent(text))
      .catch(err => console.error('Error fetching SVG:', err));
  }, []);

  useEffect(() => {
    if (svgContent && svgRef.current) {
      const paths = svgRef.current.querySelectorAll('path');
      paths.forEach(p => {
        p.setAttribute('stroke', '#000000'); 
        p.setAttribute('stroke-width', '8'); 
        p.setAttribute('fill', 'transparent'); 
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-linejoin', 'round');
      });
      
      anime.timeline()
        .add({
          targets: paths,
          strokeDashoffset: [anime.setDashoffset, 0],
          easing: 'easeInOutSine',
          duration: 4500,
          delay: function(el, i) { return i * 150 },
        })
        .add({
          targets: paths,
          fill: ['transparent', '#000000'],
          strokeWidth: ['8', '1.5'],
          duration: 1000,
          easing: 'easeInQuad'
        }, '-=800'); 
    }
  }, [svgContent]);

  return (
    <div 
      ref={svgRef} 
      className="w-[300px] h-[300px] md:w-[450px] md:h-[450px] opacity-90 drop-shadow-md flex items-center justify-center pointer-events-none" 
      dangerouslySetInnerHTML={{ __html: svgContent }} 
    />
  );
};

// --- COMPONENT: Điện ảnh - Cuộn phim 3D Cong ---
const CinematicFilmStrip = ({ images, reverse, speed = 40, className="", style={}, innerTransform="" }) => {
  if (!images || images.length === 0) return null;
  const repImages = [...images, ...images, ...images, ...images]; 
  return (
    <div className={`absolute pointer-events-none ${className}`} style={{ zIndex: 0, ...style }}>
      {/* 2.5D Wrapper */}
      <div 
        className="flex items-center p-2 md:p-3 bg-[#0a0a0a]/90 relative ring-1 ring-[#1a1a1a] min-w-max shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        style={{ transform: innerTransform }}
      >
         {/* Lỗ hổng film (Holes) */}
         <div className="absolute top-1 inset-x-0 h-1 md:h-1.5 opacity-80 z-20 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_10px,#fff_10px,#fff_14px)] mix-blend-overlay" />
         <div className="absolute bottom-1 inset-x-0 h-1 md:h-1.5 opacity-80 z-20 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_10px,#fff_10px,#fff_14px)] mix-blend-overlay" />
         
         <motion.div
           animate={{ x: reverse ? ["-25%", "0%"] : ["0%", "-25%"] }} // dịch mũi -25% vì đã x4 array
           transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
           className="flex gap-1.5 md:gap-2 px-1 relative z-10 w-max"
         >
           {/* Film Frames */}
           {repImages.map((src, i) => (
             <div key={i} className="w-[12vh] h-[9vh] md:w-[18vh] md:h-[13vh] shrink-0 bg-[#000] rounded-[2px] relative overflow-hidden ring-1 ring-white/10 group pointer-events-auto cursor-pointer">
               <img 
                  src={src} 
                  className="w-full h-full object-cover opacity-90 sepia-[30%] contrast-[1.1] brightness-[0.85] group-hover:sepia-0 group-hover:opacity-100 transition-all duration-500 ease-out" 
                  alt="Kỉ niệm" 
                  loading="lazy" 
               />
               <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
             </div>
           ))}
         </motion.div>
      </div>
    </div>
  )
}

// --- COMPONENT: CardViewer (Trang gốc) ---
const CardViewer = () => {
  const [step, setStep] = useState(1);
  const [stt, setStt] = useState('');
  const [selectedGirl, setSelectedGirl] = useState(null);
  const [allGirlsImages, setAllGirlsImages] = useState([]);
  const [isInitiating, setIsInitiating] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false); 
  const inputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load preview directly if preview_id is in URL or local preview
  useEffect(() => {
    const previewId = searchParams.get('preview_id');
    const previewLocal = searchParams.get('preview');

    if (previewLocal === 'local') {
       const localData = localStorage.getItem('temp_preview_83');
       if (localData) {
          try {
             setSelectedGirl(JSON.parse(localData));
             setStep(2);
             return;
          } catch(e) { console.error('Lỗi parse preview data', e); }
       }
    }

    if (previewId) {
       setStt(previewId);
       const fetchPreview = async () => {
           const docRef = doc(db, 'girls', previewId);
           const docSnap = await getDoc(docRef);
           if (docSnap.exists()) {
              setSelectedGirl(docSnap.data());
              setStep(2);
           }
       };
       fetchPreview();
    }
  }, [searchParams]);

  useEffect(() => {
    if (step === 1 && inputRef.current && !searchParams.get('preview_id')) {
      inputRef.current.focus();
    }
  }, [step, searchParams]);

  const handleOpenCard = async () => {
    if (!stt) return;
    
    let queryStt = stt.trim();
    if (/^0+\d+$/.test(queryStt)) {
        queryStt = parseInt(queryStt, 10).toString();
    }
    
    setIsInitiating(true);
    
    try {
      const docRef = doc(db, 'girls', queryStt);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() || queryStt === '124') {
        if (queryStt === '124') {
           getDocs(collection(db, 'girls')).then((snapshot) => {
              const imgs = [];
              snapshot.forEach((d) => {
                 if (d.data().imageUrl && d.id !== '124') {
                    imgs.push(d.data().imageUrl);
                 }
              });
              // Shuffle
              imgs.sort(() => 0.5 - Math.random());
              setAllGirlsImages(imgs.length > 0 ? imgs : [
                 "https://images.unsplash.com/photo-1517404215738-15263e9f9178?q=80&w=600&auto=format&fit=crop",
                 "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop",
                 "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
                 "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop",
                 "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop"
              ]);
           }).catch(err => {
              console.error("Lỗi tải ảnh background, dùng mẫu dự phòng", err);
              setAllGirlsImages([
                 "https://images.unsplash.com/photo-1517404215738-15263e9f9178?q=80&w=600&auto=format&fit=crop",
                 "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop",
                 "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
                 "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop",
                 "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop"
              ]);
           });
        }

        setTimeout(() => {
          let customData = null;
          if (docSnap.exists()) {
              customData = docSnap.data();
          } else if (queryStt === '124') {
              customData = {
                  stt: '124',
                  name: 'Cô Bạch Loan',
                  wish: 'Một người lái đò thầm lặng, thanh xuân của chúng em rực rỡ một phần nhờ sự hiện diện của Cô. Kính chúc Cô luôn tươi trẻ, bình an và ngập tràn hạnh phúc.',
                  signature: 'Tập thể 12A4',
                  imageUrl: '/bachloan_avatar.jpg' 
              };
          }
          setSelectedGirl(customData);
          setStep(2);
          setIsInitiating(false);
        }, 6000); // Intro Animation Delay
      } else {
        alert('Chưa có thông tin cho mã định danh này.');
        setIsInitiating(false);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải dữ liệu từ máy chủ.');
      setIsInitiating(false);
    }
  };

  return (
    <div className="w-full h-full relative font-sans-editorial selection:bg-[var(--color-rust)] selection:text-white">
      
      <div className="fixed top-8 right-6 md:top-12 md:left-8 vertical-text text-[10px] md:text-sm font-bold tracking-[0.4em] uppercase text-[var(--color-charcoal)]/30 pointer-events-none z-[100] hidden md:block">
        PROJECT VENUS // KÝ SỰ BÍ MẬT // TỪ NHỮNG đực rựa
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="frame1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            transition={{ duration: 0.8 }}
            className="w-full h-[100dvh] flex flex-col justify-center z-10 bg-[var(--color-oatmeal)] overflow-hidden relative"
          >
            <AnimatePresence>
              {isInitiating && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
                  exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  transition={{ duration: 0.8 }}
                  className="fixed inset-0 z-[200] bg-[var(--color-oatmeal)] flex flex-col justify-center items-center"
                >
                  <LoadingSVG />
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="mt-6 font-sans-editorial uppercase tracking-[0.4em] text-[10px] md:text-sm text-[var(--color-charcoal)]/80 flex items-center relative z-10 font-bold"
                  >
                    DECODING <span className="flex gap-1 ml-2">
                      <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}>.</motion.span>
                      <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}>.</motion.span>
                      <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}>.</motion.span>
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute top-0 left-0 w-full z-20">
              <EditorialMarquee direction="left" text="CHÚC MỪNG NGÀY QUỐC TẾ PHỤ NỮ 8/3" />
            </div>

            <div className="absolute top-1/2 left-0 -translate-y-1/2 text-[18vw] md:text-[15vw] font-serif-editorial italic text-stroke-huge pointer-events-none whitespace-nowrap z-0 origin-left opacity-50">
              Mỹ nhân
            </div>

            <div className="w-full max-w-4xl relative z-10 mx-auto px-6 md:px-0 flex flex-col justify-center items-start pt-16 pb-16">
               <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 1 }}
                  className="font-serif-editorial text-[2.5rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[6.2rem] leading-[1.3] md:leading-[1.15] text-[var(--color-charcoal)] text-left"
               >
                 Xin chào, <br />
                 tôi là đóa hoa mang <br className="hidden md:block" />
                 số thứ tự 
                 <span className="inline-block mx-3 md:mx-5">
                   <input 
                     ref={inputRef}
                     type="text" 
                     value={stt}
                     onChange={(e) => setStt(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && handleOpenCard()}
                     placeholder="XX"
                     className="bg-transparent border-b-[3px] border-[var(--color-charcoal)]/30 focus:border-[var(--color-rust)] outline-none text-center transition-colors w-[2.2em] md:w-[1.6em] font-sans-editorial text-[var(--color-rust)] pb-0 md:pb-2 text-[2.2rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[6.2rem] leading-[1]"
                   />
                 </span>
                 trong <br className="block md:hidden"/>
                 danh sách lớp học <br className="hidden md:block"/>
                 của chúng ta.
               </motion.h1>

               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.6, duration: 1 }}
               >
                 <div className="text-[1.2rem] md:text-[2rem] font-sans-editorial font-light text-[var(--color-charcoal)]/60 tracking-normal inline-block mt-6 md:mt-8">
                   Vui lòng nhập số thứ tự của các bạn để <br className="block md:hidden"/> mở.
                 </div>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.8, duration: 1 }}
                 className="mt-8 md:mt-8 flex justify-start"
               >
                 <button 
                   onClick={handleOpenCard}
                   className="flex text-[9px] sm:text-[10px] md:text-[13px] font-sans-editorial font-medium uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[var(--color-charcoal)]/70 hover:text-[var(--color-rust)] transition-colors items-center gap-2 md:gap-3 group whitespace-nowrap"
                 >
                   <span>Bấm vào đây hoặc nhấn</span>
                   <span className="px-3 sm:px-4 py-1.5 border border-[var(--color-charcoal)]/30 rounded text-[9px] sm:text-[10px] group-hover:border-[var(--color-rust)]/80 bg-white/40 backdrop-blur-sm transition-all shadow-sm shrink-0">ENTER</span> 
                   <span>để tiếp tục</span>
                 </button>
               </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 w-full z-20">
              <EditorialMarquee direction="right" text="TÔN VINH VẺ ĐẸP VÀ TRÍ TUỆ CỦA PHỤ NỮ" />
            </div>
          </motion.div>

        ) : (

          /* --- FRAME 2: AVANT-GARDE EDITORIAL --- */
          <motion.div
            key="frame2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-[100dvh] relative overflow-hidden z-10 bg-[var(--color-oatmeal)]"
          >
            
            {/* 📱 MOBILE ADVANCED UX */}
            <div className="flex md:hidden w-full h-[100dvh] relative overflow-hidden bg-[#1c1a19] text-[#f4f2ee] touch-none">
                
                {/* 1. Full Screen Iframe Background / Film Roll */}
                <div className="absolute inset-0 z-0 bg-[#0a0a09] overflow-hidden">
                   <iframe src="/animated.html" className="w-full h-full border-none pointer-events-auto opacity-70" title="Flowers" />
                   
                   {/* Cinematic Film Overlays in Mobile */}
                   {selectedGirl?.stt === '124' && (
                      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden drop-shadow-2xl opacity-90">
                         {/* Đi thẳng chéo */}
                         <CinematicFilmStrip images={allGirlsImages} speed={45} className="top-[10%] -left-[50vw]" innerTransform="rotate(20deg) scale(1)" />
                         <CinematicFilmStrip images={allGirlsImages} reverse speed={55} className="bottom-[15%] -left-[50vw]" innerTransform="rotate(-25deg) scale(0.9)" />
                      </div>
                   )}

                   <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-black/95 pointer-events-none z-10" />
                </div>

                {/* 2. Top Name Overlay */}
                <div className="absolute top-[15%] left-6 z-20 pointer-events-none max-w-[85vw] flex flex-col gap-0 justify-start items-start text-left drop-shadow-xl">
                   {selectedGirl?.name?.split(' ').map((word, i) => {
                      const baseSize = "text-[3.5rem] leading-[0.8]"; 
                      let margin = `${i * 1.5}rem`; 
                      if(i > 3) margin = `${3 * 1.5}rem`; 
                      return (
                         <motion.h1 
                           key={i} 
                           initial={{ opacity: 0, x: -20, y: 15 }}
                           animate={{ opacity: 1, x: 0, y: 0 }}
                           transition={{ delay: 0.6 + (i * 0.15), duration: 0.8 }}
                           style={{ marginLeft: margin }}
                           className={`font-serif-editorial italic ${baseSize} text-white drop-shadow-[0_4px_16px_rgba(0,0,0,1)] ${i % 2 === 0 ? 'font-bold' : 'font-light'}`}
                         >
                           {word}
                         </motion.h1>
                      )
                   })}
                </div>

                {/* 3. Bottom Action Area (Glass Button trigger Bottom Sheet) */}
                <div className="absolute bottom-6 w-full px-5 z-[55] flex flex-col items-center pointer-events-none">
                   <button 
                     onClick={() => setQuoteOpen(true)}
                     className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 text-white rounded-[1.5rem] py-4 px-6 flex items-center justify-between group overflow-hidden relative pointer-events-auto shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
                   >
                     <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                     <div className="flex flex-col items-start relative z-10">
                        <span className="font-sans-editorial text-[9px] text-white/50 uppercase tracking-[0.3em] font-bold mb-1">Thao tác</span>
                        <span className="font-serif-editorial text-[1.4rem] italic leading-none">Giải mã thông điệp</span>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-white text-[var(--color-charcoal)] flex items-center justify-center relative z-10 transition-transform group-hover:-translate-y-1 shadow-[0_0_20px_white]">
                        <ChevronUp size={20} strokeWidth={2} />
                     </div>
                   </button>
                </div>

                {/* 4. DRAWER SHEET */}
                <AnimatePresence>
                  {quoteOpen && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setQuoteOpen(false)}
                        className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md pointer-events-auto"
                      />
                      <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        onDragEnd={(e, info) => {
                           if (info.offset.y > 80 || info.velocity.y > 500) setQuoteOpen(false);
                        }}
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 220, mass: 0.8 }}
                        className="absolute bottom-0 left-0 w-full h-[65dvh] z-[70] bg-[var(--color-oatmeal)] text-[var(--color-charcoal)] rounded-t-[2.5rem] pt-3 pb-8 px-6 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] touch-none pointer-events-auto border-t border-[var(--color-oatmeal)]"
                      >
                         <div className="w-12 h-1.5 bg-[var(--color-charcoal)]/20 rounded-full mx-auto mb-6 shrink-0" />
                         
                         <div className="flex items-start justify-between mb-8 overflow-hidden shrink-0 pr-2">
                            <div className="flex flex-col gap-1 mt-2">
                               <div className="flex items-center gap-2 text-[var(--color-charcoal)]/50 mb-1">
                                  <QrCode strokeWidth={1.5} size={22} className="text-[var(--color-rust)]" />
                                  <span className="font-sans-editorial text-[10px] uppercase tracking-[0.3em]">Mã định danh</span>
                               </div>
                               <button 
                                  onClick={() => navigate(`/share/${selectedGirl?.stt}`)}
                                  className="font-mono text-xl text-[var(--color-charcoal)] tracking-widest font-medium text-left hover:text-[var(--color-rust)] transition-colors"
                                  title="Chia sẻ thiệp này"
                               >
                                 #83-{selectedGirl?.stt}
                               </button>
                            </div>
                            <AvatarWithCircularText text="TÔN VINH VẺ ĐẸP PHỤ NỮ • 8/3 • " imgSrc={selectedGirl?.imageUrl} />
                         </div>

                         <div className="flex-1 w-full mx-auto relative mb-6 overflow-y-auto pr-1 pb-16">
                            <div className="pt-2 pb-6 px-1 h-full flex flex-col justify-start relative">
                               <span className="absolute -top-4 -left-1 text-7xl text-[var(--color-rust)] opacity-20 font-serif-editorial leading-none">"</span>
                               <div className="font-serif-editorial relative z-10 text-justify w-full">
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({node, ...props}) => <p className="text-[1.45rem] leading-[1.6] text-[var(--color-charcoal)] mb-4" {...props} />,
                                      strong: ({node, ...props}) => <strong className="font-bold text-[var(--color-rust)]" {...props} />,
                                      em: ({node, ...props}) => <em className="italic font-light" {...props} />,
                                      a: ({node, ...props}) => <a className="text-[var(--color-rust)] underline underline-offset-4 decoration-[1.5px] decoration-[var(--color-rust)]/50 hover:decoration-[var(--color-rust)] transition-all pointer-events-auto relative z-50" target="_blank" rel="noopener noreferrer" {...props} />
                                    }}
                                  >
                                    {selectedGirl?.wish || defaultWish}
                                  </ReactMarkdown>
                                </div>
                                {selectedGirl?.signature && (
                                  <div className="w-full text-right mt-6 pr-4">
                                    <span className="font-serif-editorial italic text-xl sm:text-2xl font-bold text-[var(--color-rust)]/80 inline-block">
                                       — {selectedGirl.signature}
                                    </span>
                                  </div>
                                )}
                             </div>
                          </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
            </div>

            {/* 💻 PC EDITORIAL MAGAZINE LAYOUT */}
            <div className="hidden md:flex flex-row w-full h-[100dvh] relative z-10 bg-[var(--color-oatmeal)] overflow-hidden">
               
               <button 
                 onClick={() => setStep(1)}
                 className="absolute top-12 left-12 z-[60] text-[var(--color-charcoal)] hover:text-[var(--color-rust)] transition-colors p-2 mix-blend-difference"
               >
                 <ArrowLeft strokeWidth={1} size={36} />
               </button>

               {/* =========================================
                   GLOBAL CINEMATIC FILM STRIPS (PC ONLY)
                   Layers run across the entire screen behind content
                   ========================================= */}
               {selectedGirl?.stt === '124' && (
                  <div className="absolute inset-0 z-0 pointer-events-none overflow-visible opacity-50 drop-shadow-2xl flex items-center justify-center pointer-events-none">
                     {/* Phim ngang vắt chéo chìm (Top Left -> Bottom Right) */}
                     <CinematicFilmStrip images={allGirlsImages} speed={60} className="absolute" innerTransform="rotate(35deg) scale(1.1) translateY(-25vh)" />
                     
                     {/* Phim ngang vắt chéo nổi (Top Right -> Bottom Left) */}
                     <CinematicFilmStrip images={allGirlsImages} reverse speed={50} className="absolute" innerTransform="rotate(-20deg) scale(0.9) translateY(40vh)" />
                     
                     {/* Đường phim siêu dài xẻ ngang màn hình */}
                     <CinematicFilmStrip images={allGirlsImages} speed={80} className="absolute" innerTransform="rotate(5deg) scale(1.3) translateY(0vh)" />
                  </div>
               )}

                {/* Left Context Area (45%) */}
               <div className="w-[45%] h-full flex flex-col justify-center pl-16 lg:pl-24 relative z-10 pointer-events-none">

                  <div className="flex flex-col items-start justify-center w-full relative z-10">
                    {/* AVATAR + CIRCULAR TEXT */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 1 }}
                      className="mb-8 ml-8"
                    >
                      <AvatarWithCircularText text="TÔN VINH VẺ ĐẸP PHỤ NỮ • 8/3 • " imgSrc={selectedGirl?.imageUrl} />
                    </motion.div>

                    {/* NAME */}
                    {selectedGirl?.name?.split(' ').map((word, i) => {
                       let margin = `${i * 3}rem`; 
                       return (
                         <motion.h1 
                           key={i} 
                           initial={{ x: -20, opacity: 0 }}
                           animate={{ x: 0, opacity: 1 }}
                           transition={{ delay: 0.4 + (i * 0.15), duration: 1 }}
                           style={{ marginLeft: margin }}
                           className={`font-serif-editorial italic text-[5.5rem] lg:text-[7.5rem] leading-[0.85] tracking-tight text-[var(--color-charcoal)] drop-shadow-sm ${i % 2 === 0 ? 'font-bold' : 'font-light'}`}
                         >
                           {word}
                         </motion.h1>
                       )
                    })}
                  </div>
               </div>

               {/* Right Image Area (55%) iframe + Quote */}
               <div className="w-[55%] h-full relative z-20 p-12 pr-12 xl:pr-24 bg-transparent flex items-center justify-center pointer-events-none">
                  
                  {/* Khung Iframe Hoa */}
                  <div className="w-full h-full relative shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm z-10 overflow-hidden bg-[#1a1918] pointer-events-auto">
                     <iframe src="/animated.html" className="absolute inset-0 w-full h-full border-none pointer-events-auto opacity-100" title="Flowers" />
                     {/* Overlay gradient so text remains readable */}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-20" />
                  </div>
                  
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="absolute -left-[10%] lg:-left-[25%] bottom-[8%] w-[95%] max-w-[850px] bg-[var(--color-oatmeal)]/98 backdrop-blur-xl p-10 lg:p-14 shadow-[20px_20px_60px_rgba(0,0,0,0.25)] border border-[var(--color-charcoal)]/10 z-30 pointer-events-auto"
                  >
                     <span className="absolute -top-7 -left-3 text-7xl text-[var(--color-rust)] opacity-30 font-serif-editorial leading-none">"</span>
                     <div className="font-serif-editorial relative z-10 text-justify w-full max-h-[45vh] overflow-y-auto pr-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--color-charcoal)]/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[var(--color-rust)]/40 transition-colors">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="text-[1.55rem] lg:text-[1.9rem] leading-[1.5] text-[var(--color-charcoal)] mb-5" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-[var(--color-rust)]" {...props} />,
                            em: ({node, ...props}) => <em className="italic font-light" {...props} />,
                            a: ({node, ...props}) => <a className="text-[var(--color-rust)] underline underline-offset-4 decoration-[1.5px] decoration-[var(--color-rust)]/50 hover:decoration-[var(--color-rust)] transition-all pointer-events-auto relative z-50" target="_blank" rel="noopener noreferrer" {...props} />
                          }}
                        >
                          {selectedGirl?.wish || defaultWish}
                        </ReactMarkdown>
                     </div>
                     
                     {selectedGirl?.signature && (
                        <div className="w-full text-right mt-10">
                           <span className="font-serif-editorial italic text-3xl lg:text-4xl font-bold text-[var(--color-rust)]/80 inline-block mr-6">
                              — {selectedGirl.signature}
                           </span>
                        </div>
                     )}
                     
                     <div className="mt-8 pt-6 border-t border-[var(--color-charcoal)]/10 flex items-center justify-between">
                        <button 
                          onClick={() => window.open(`/#/share/${selectedGirl?.stt}`, '_blank')}
                          className="flex items-center gap-2 text-[var(--color-charcoal)]/50 hover:text-[var(--color-rust)] transition-colors group cursor-pointer"
                          title="Chia sẻ thiệp này"
                        >
                          <QrCode strokeWidth={1.5} size={18} className="text-[var(--color-rust)] group-hover:scale-110 transition-transform" />
                          <span className="font-sans-editorial text-[10px] uppercase tracking-[0.2em]">ID: #83-{selectedGirl?.stt}</span>
                        </button>
                        <span className="font-sans-editorial text-[11px] lg:text-[13px] uppercase tracking-[0.25em] font-bold text-[var(--color-rust)]">
                           12A4
                        </span>
                     </div>
                  </motion.div>
               </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CardViewer />} />
      <Route path="/systemremits" element={<SystemRemits />} />
      <Route path="/share/:id" element={<ShareCard />} />
    </Routes>
  );
}
