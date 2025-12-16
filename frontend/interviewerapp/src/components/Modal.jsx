import React from 'react'
import {AiOutlineClose} from "react-icons/ai";

const Modal = ({children,isOpen,onClose,title,hideHeader}) => {

  if(!isOpen) return null;
  return  <div className='fixed inset-0 z-50 flex justify-center items-center w-full h-full' style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      {/*Modal Content*/}
      <div className={`relative flex flex-col bg-white shadow-neo border-3 border-black overflow-hidden`} style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
{/*Modal Header*/}


  {!hideHeader &&(
    <div className='flex items-center justify-between p-4 border-b-3 border-black'>
        <h3 className='md:text-lg font-bold' style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
    </div> 
  )}
  <button
  type="button"
  className='text-gray-400 bg-transparent hover:bg-gray-100 rounded-lg text-sm w-8 h-8 flex justify-center items-center absolute top-3.5 right-3.5 cursor-pointer border-2 border-black hover:shadow-neo-sm transition-all'
  onClick={onClose}
  style={{ zIndex: 10 }}
  >
    <AiOutlineClose size={20}/>
  </button>
  {/* Modal Body (Scrollable)*/}
  <div className='flex-1 overflow-y-auto custom-scrollbar'>
    {children}

  </div>
</div>
</div>
};
export default Modal;
