import React from 'react';

const Empty: React.FC = () => {
  return (
    <div className='w-full h-full my-[200px] items-center justify-center'>
      <h1 className='text-[50px] text-[#026670] font-bold text-center'>
        You don't have devices.
      </h1>
    </div>
  );
}

export default Empty;
