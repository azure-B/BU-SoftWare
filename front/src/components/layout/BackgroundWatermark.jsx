import { LOGO_APP } from '../constants';

function BackgroundWatermark() {
  return (
    <div className="absolute inset-0 z-[-1] flex items-start justify-center pt-32 opacity-[0.03] pointer-events-none">
      <img alt="" className="w-[600px] h-auto" src={LOGO_APP} aria-hidden="true" />
    </div>
  );
}

export default BackgroundWatermark;
