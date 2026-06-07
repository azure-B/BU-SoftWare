import { LOGO_APP } from '../constants';

function BackgroundWatermark() {
  return (
    <div
      className="app-watermark pointer-events-none fixed inset-0 z-0 flex items-start justify-center pt-32"
      aria-hidden="true"
    >
      <img alt="" className="app-watermark__logo w-[600px] max-w-[85vw] h-auto opacity-[0.03]" src={LOGO_APP} />
    </div>
  );
}

export default BackgroundWatermark;
