import React from 'react';

const Loader: React.FC = () => {
  return (
    <>
      <div className='fixed z-[10] top-0 left-0 w-[100vw] h-[100vh] min-h-[500px] flex justify-center items-center bg-[#FFF] gap-2'>
        <div className="w-10 h-10 border-4 border-t-[#026670] border-gray-300 rounded-full animate-spin"></div>
        <div className='text-[#026670] text-[20px]'>Loading securely… Please hold for a moment</div>
      </div>
    </>
  );
}

export default Loader;
