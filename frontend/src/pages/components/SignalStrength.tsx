import React from 'react';

const SignalStrength: React.FC<{ signalStrength: number }> = ({ signalStrength }) => {

  const totalLength = 5;

  return (
    <div className='flex items-end justify-center'>
      {
        [...Array(totalLength)].map((_, index) => (
          <div
            key={index}
            className='m-[1px] w-[3px] rounded-[2px]'
            style={{
              height: 6 + 2 * index,
              backgroundColor: index < signalStrength ? '#0c8c97' : '#AAA',
            }}
          >

          </div>
        ))
      }
    </div>
  );
}

export default SignalStrength;
