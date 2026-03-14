import React, { useState, useRef, useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import Cropper from 'react-easy-crop';
import { Camera, Save, Loader2, CheckCircle2, Eye, DownloadCloud, Bold, Italic, Link, List, Quote, PenTool, RotateCw, FlipHorizontal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return canvas.toDataURL('image/jpeg', 0.9);
};

const manipulateImage = async (src, type) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (type === 'rotate') {
    canvas.width = image.height;
    canvas.height = image.width;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
  } else if (type === 'flip') {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0);
  }
  return canvas.toDataURL('image/jpeg', 0.9);
};

export default function SystemRemits() {
  const [stt, setStt] = useState('');
  const [name, setName] = useState('');
  const [wish, setWish] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fileInputRef = useRef(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setCroppedImage(null);
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const handleFinishCrop = async () => {
    try {
      const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedImage(croppedDataUrl);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
      alert('Lỗi cắt ảnh!');
    }
  };

  const handleManipulate = async (type) => {
    if(!imageSrc) return;
    try {
      const newSrc = await manipulateImage(imageSrc, type);
      setImageSrc(newSrc);
    } catch(e) {
      console.error(e);
    }
  };

  const handleLoadExisting = async () => {
    if (!stt) {
      alert('Vui lòng nhập Mã định danh (STT/ID) trước!');
      return;
    }
    setIsLoading(true);
    setStatusMsg('Đang đồng bộ dữ liệu...');
    try {
      const docRef = doc(db, 'girls', stt);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || '');
        setWish(data.wish || '');
        setCroppedImage(data.imageUrl ? data.imageUrl : null);
        setStatusMsg('Dữ liệu đã được tải.');
      } else {
        setName('');
        setWish('');
        setCroppedImage(null);
        setStatusMsg('ID mới. Bạn có thể bắt đầu tạo.');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Lỗi đồng bộ!');
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!stt || !name || !wish) {
      alert('Bạn cần điền tối thiểu STT, Tên và Lời chúc.');
      return;
    }
    if (!croppedImage && !imageSrc) {
      alert('Vui lòng chọn một bức ảnh ấn tượng nhé!');
      return;
    }

    setIsLoading(true);
    setStatusMsg('Đang xử lý...');

    try {
      let finalImageUrl = croppedImage;
      if (!finalImageUrl && imageSrc) {
        finalImageUrl = imageSrc; 
      }
      
      if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
        setStatusMsg('Đang tải ảnh lên máy chủ...');
        const imageRef = ref(storage, `portraits/${stt}_${Date.now()}.jpg`);
        await uploadString(imageRef, finalImageUrl, 'data_url');
        finalImageUrl = await getDownloadURL(imageRef);
      }

      setStatusMsg('Đang đóng gói dữ liệu...');
      await setDoc(doc(db, 'girls', stt), {
        stt,
        name,
        wish,
        imageUrl: finalImageUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setStatusMsg('Hoàn tất! Hệ thống đã ghi nhận.');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setStatusMsg('Lỗi: ' + err.message);
    }
    setIsLoading(false);
  };

  const handlePreview = () => {
    if (!name || (!croppedImage && !imageSrc)) {
      alert('Chúng tôi cần biết Tên và có Ảnh để có thể giả lập bản xem trước!');
      return;
    }
    const previewData = {
       stt: stt || '00',
       name: name || 'Tên Khách Mời',
       wish: wish || 'Mong mọi điều tốt lành và vui vẻ nhất sẽ đến với bạn trong ngày hôm nay.',
       imageUrl: croppedImage || imageSrc
    };
    localStorage.setItem('temp_preview_83', JSON.stringify(previewData));
    window.open(`/#/?preview=local`, '_blank');
  };

  const handleFormat = (prefix, suffix) => {
    const textarea = document.getElementById('wish-editor');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = wish.slice(start, end);
    const newText = wish.slice(0, start) + prefix + selectedText + suffix + wish.slice(end);
    
    setWish(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-[#faf8f5] text-[#1c1a19] font-sans-editorial">
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-12 pb-32">
        
        {/* HEADER */}
        <div className="flex flex-col gap-2">
          <div className="inline-block px-3 py-1 bg-[#a65d57]/10 text-[#a65d57] text-[10px] font-bold tracking-[0.2em] rounded-full w-max uppercase">
            Workspace Admin
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif-editorial tracking-tight font-light mt-3 leading-[1.1]">
            Trung tâm <br className="block sm:hidden"/> Điều phối <span className="font-bold italic">Dữ liệu</span>
          </h1>
          <p className="opacity-50 text-xs sm:text-sm font-medium mt-2">Cập nhật thông tin hoa khôi theo mã định danh nhanh nhất.</p>
        </div>

        <div className="w-full h-[1px] bg-[#1c1a19]/10" />

        {/* CỤM 1: ĐỊNH DANH */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <div className="flex flex-col gap-2 w-full">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1c1a19]/50">Mã định danh (STT)</label>
              <input 
                type="text" 
                value={stt}
                onChange={e => setStt(e.target.value)}
                placeholder="VD: 01, 15, NgocLan" 
                className="w-full bg-transparent border-b border-[#1c1a19]/20 focus:border-[#a65d57] outline-none py-2 text-2xl font-serif-editorial transition-all"
              />
            </div>
            <button 
              onClick={handleLoadExisting}
              disabled={isLoading}
              className="w-full sm:w-auto bg-[#1c1a19]/5 hover:bg-[#1c1a19]/10 text-[#1c1a19] px-6 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
            >
              <DownloadCloud size={16} /> Đồng bộ
            </button>
          </div>
        </div>

        <div className="w-full h-[1px] bg-[#1c1a19]/10" />

        {/* CỤM 2: NỘI DUNG CHÍNH */}
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1c1a19]/50">Danh xưng hiển thị</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nguyễn Thị A..." 
              className="w-full bg-transparent border-b border-[#1c1a19]/20 focus:border-[#a65d57] outline-none py-3 text-3xl sm:text-4xl font-serif-editorial italic transition-all"
            />
          </div>

          <div className="flex flex-col gap-3 sm:gap-2 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-1">
               <label className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-[#1c1a19]/50 block">Trích dẫn & Lời chúc</label>
               <div className="flex bg-[#1c1a19]/5 rounded-lg p-1 self-start sm:self-auto w-full sm:w-auto">
                 <button 
                   onClick={() => setActiveTab('write')} 
                   className={`flex-1 sm:flex-none uppercase px-4 py-2 sm:py-1.5 text-[9px] sm:text-xs font-bold tracking-wider rounded-md flex items-center justify-center gap-1.5 transition-all ${activeTab === 'write' ? 'bg-white shadow-sm text-[#1c1a19]' : 'text-[#1c1a19]/50 hover:text-[#1c1a19]'}`}
                 >
                   <PenTool size={12} /> Soạn thảo
                 </button>
                 <button 
                   onClick={() => setActiveTab('preview')} 
                   className={`flex-1 sm:flex-none uppercase px-4 py-2 sm:py-1.5 text-[9px] sm:text-xs font-bold tracking-wider rounded-md flex items-center justify-center gap-1.5 transition-all ${activeTab === 'preview' ? 'bg-white shadow-sm text-[#a65d57]' : 'text-[#1c1a19]/50 hover:text-[#1c1a19]'}`}
                 >
                   <Eye size={12} /> Xem nhanh
                 </button>
               </div>
            </div>

            {activeTab === 'write' ? (
              <div className="w-full flex flex-col transition-colors group">
                {/* Markdown Toolbar */}
                <div className="flex items-center gap-1 pb-3 mb-2 border-b border-[#1c1a19]/10 overflow-x-auto shrink-0 touch-pan-x opacity-60 group-focus-within:opacity-100 transition-opacity">
                   <button onClick={() => handleFormat('**', '**')} className="p-2 hover:bg-[#1c1a19]/10 rounded-md text-[#1c1a19] transition-colors" title="Bold"><Bold size={16} /></button>
                   <button onClick={() => handleFormat('_', '_')} className="p-2 hover:bg-[#1c1a19]/10 rounded-md text-[#1c1a19] transition-colors" title="Italic"><Italic size={16} /></button>
                   <div className="w-[1px] h-4 bg-[#1c1a19]/20 mx-1 shrink-0" />
                   <button onClick={() => handleFormat('> ', '')} className="p-2 hover:bg-[#1c1a19]/10 rounded-md text-[#1c1a19] transition-colors" title="Quote"><Quote size={16} /></button>
                   <button onClick={() => handleFormat('- ', '')} className="p-2 hover:bg-[#1c1a19]/10 rounded-md text-[#1c1a19] transition-colors" title="List"><List size={16} /></button>
                   <div className="w-[1px] h-4 bg-[#1c1a19]/20 mx-1 shrink-0" />
                   <button onClick={() => handleFormat('[Title](', ')')} className="p-2 hover:bg-[#1c1a19]/10 rounded-md text-[#1c1a19] transition-colors" title="Link"><Link size={16} /></button>
                </div>
                
                <textarea 
                  id="wish-editor"
                  value={wish}
                  onChange={e => setWish(e.target.value)}
                  placeholder="Hỗ trợ Markdown (**Đậm**, _Nghiêng_)..." 
                  rows={6}
                  className="w-full bg-transparent border-none outline-none py-2 text-xl font-serif-editorial resize-y leading-[1.6]"
                />
              </div>
            ) : (
              <div className="w-full bg-white/50 border border-[#1c1a19]/10 p-6 rounded-[1rem] min-h-[160px] max-h-[400px] overflow-y-auto mt-2">
                 <div className="font-serif-editorial relative z-10 text-justify w-full">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p className="text-[1.3rem] leading-[1.5] text-[#1c1a19] mb-4" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-[#a65d57]" {...props} />,
                        em: ({node, ...props}) => <em className="italic font-light" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#a65d57] pl-4 italic opacity-80 shrink-0 mb-4" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-[1.2rem]" {...props} />,
                        a: ({node, ...props}) => <a className="text-[#a65d57] underline underline-offset-4" {...props} />
                      }}
                    >
                      {wish || '*Chưa có nội dung.*'}
                    </ReactMarkdown>
                 </div>
              </div>
            )}
            
          </div>
        </div>

        <div className="w-full h-[1px] bg-[#1c1a19]/10" />

        {/* CỤM 3: HÌNH ẢNH */}
        <div className="flex flex-col gap-6">
           <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1c1a19]/50">Ảnh chân dung</label>
           
           {!imageSrc && (
             <div className="flex flex-col sm:flex-row gap-5 items-center">
               {croppedImage && (
                 <div className="w-28 h-28 rounded-full overflow-hidden border-[3px] border-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] shrink-0">
                   <img src={croppedImage} alt="Avatar" className="w-full h-full object-cover" />
                 </div>
               )}
               <input 
                 type="file" 
                 accept="image/*" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 className="hidden" 
               />
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="flex flex-col items-center justify-center gap-3 border-[1.5px] border-dashed border-[#1c1a19]/20 hover:border-[#1c1a19]/50 hover:bg-[#1c1a19]/5 text-[#1c1a19]/70 w-full rounded-[1rem] transition-all h-32 active:scale-[0.99]"
               >
                 <Camera size={28} strokeWidth={1.5} />
                 <span className="font-semibold text-xs uppercase tracking-widest">Tải ảnh lên</span>
               </button>
             </div>
           )}

           {imageSrc && (
             <div className="flex flex-col gap-4">
               <div className="relative w-full h-[60vh] sm:h-[450px] bg-[#1c1a19] rounded-[1rem] overflow-hidden shadow-inner">
                 <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={true}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
               </div>
               
               <div className="flex flex-col gap-4 p-5 bg-[#faf8f5] rounded-[1rem] border border-[#1c1a19]/5">
                  <div className="flex items-center gap-4 w-full">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a65d57] shrink-0">Scale</span>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.05}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(e.target.value)}
                      className="w-full h-1.5 bg-[#1c1a19]/10 rounded-lg appearance-none cursor-pointer accent-[#a65d57]"
                    />
                  </div>
                  
                  <div className="flex flex-row justify-between items-center w-full gap-2">
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleManipulate('rotate')}
                        className="p-3 bg-white hover:bg-black/5 text-[#1c1a19] border border-[#1c1a19]/10 rounded-xl transition-colors active:scale-95 flex items-center justify-center"
                        title="Xoay trái"
                      >
                        <RotateCw size={18} />
                      </button>
                      <button 
                        onClick={() => handleManipulate('flip')}
                        className="p-3 bg-white hover:bg-black/5 text-[#1c1a19] border border-[#1c1a19]/10 rounded-xl transition-colors active:scale-95 flex items-center justify-center"
                        title="Lật ngang"
                      >
                        <FlipHorizontal size={18} />
                      </button>
                    </div>

                    <div className="flex gap-2 flex-1 justify-end">
                      <button 
                        onClick={() => setImageSrc(null)}
                        className="bg-white hover:bg-black/5 text-[#1c1a19] border border-[#1c1a19]/10 px-4 py-3 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider active:scale-95"
                      >
                        Hủy
                      </button>
                      <button 
                        onClick={handleFinishCrop}
                        className="bg-[#1c1a19] hover:bg-[#34302e] text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider active:scale-95 w-full sm:w-auto"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </div>
               </div>
             </div>
           )}
        </div>

      </div>

      {/* FLOAT ACTION BAR (MOBILE OPTIMIZED) */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-[#1c1a19]/10 p-4 sm:p-6 z-[100] pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
         <div className="max-w-3xl mx-auto flex flex-col gap-3">
           
           <div className="flex items-center gap-2 justify-center text-[11px] uppercase tracking-widest font-semibold text-center w-full mb-1">
              {isLoading && <Loader2 className="animate-spin text-[#a65d57]" size={14} />}
              {statusMsg && !isLoading && <CheckCircle2 size={14} className={statusMsg.includes('Lỗi') ? 'text-red-500' : 'text-green-600'} />}
              <span className={!isLoading && statusMsg.includes('Lỗi') ? 'text-red-500' : (isLoading ? 'text-[#a65d57]' : 'text-green-700')}>{statusMsg}</span>
           </div>
           
           <div className="flex gap-3 mt-2 sm:mt-0">
             <button 
               onClick={handlePreview}
               className="w-16 sm:w-auto sm:flex-1 h-14 sm:h-auto sm:py-4 rounded-2xl bg-white border border-[#1c1a19]/10 hover:bg-[#faf8f5] text-[#1c1a19] font-bold transition-colors shadow-sm text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] shrink-0"
               title="Xem Trước Layout"
             >
               <Eye size={20} /> <span className="hidden sm:inline">Xem trước</span>
             </button>
             
             <button 
               onClick={handleSave}
               disabled={isLoading}
               className="flex-1 h-14 sm:h-auto sm:py-4 rounded-2xl bg-[#a65d57] hover:bg-[#8e4f4a] text-white font-bold transition-all shadow-[0_4px_20px_rgba(166,93,87,0.4)] text-[11px] sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale active:scale-[0.98]"
             >
               {isLoading ? 'Đang tải...' : <><Save size={18} /> Lưu Dữ Liệu</>}
             </button>
           </div>
         </div>
      </div>

    </div>
  );
}
