const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const deadZone=(v,z=.035)=>Math.abs(v)<=z?0:Math.sign(v)*(Math.abs(v)-z)/(1-z);
export class GyroController{
 constructor(){
  this.active=false;this.calibrated=false;this.controls={x:0,y:0};this.baseline={beta:0,gamma:0};this.latest=null;this.filtered={pitch:0,roll:0};this.screenAngle=this.angle();
  this.state=document.querySelector("#gyro-state");this.message=document.querySelector("#gyro-message");this.indicator=document.querySelector("#gyro-indicator");this.enableButton=document.querySelector("#gyro-enable");this.calibrateButton=document.querySelector("#gyro-calibrate");
  this.onOrientation=e=>{if(!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;this.latest={beta:e.beta,gamma:e.gamma};if(!this.active)return;if(!this.calibrated){this.baseline={...this.latest};this.calibrated=true;this.state.textContent="ACTIVE";this.message.textContent="Gyro ready · tilt gently to steer";}const a=this.axes(e.beta-this.baseline.beta,e.gamma-this.baseline.gamma);const pitch=deadZone(clamp(a.pitch/24,-1,1));const roll=deadZone(clamp(a.roll/24,-1,1));this.filtered.pitch+=(pitch-this.filtered.pitch)*.18;this.filtered.roll+=(roll-this.filtered.roll)*.18;this.controls.y=this.filtered.pitch;this.controls.x=this.filtered.roll;this.render();};
  this.onScreenChange=()=>{this.screenAngle=this.angle();if(this.latest&&this.active)this.calibrate();};
  this.enableButton?.addEventListener("click",()=>this.enable());this.calibrateButton?.addEventListener("click",()=>this.calibrate());window.addEventListener("orientationchange",this.onScreenChange);window.screen?.orientation?.addEventListener?.("change",this.onScreenChange);
 }
 angle(){return Number(window.screen?.orientation?.angle??window.orientation??0);}
 axes(beta,gamma){const a=((this.screenAngle%360)+360)%360;if(a>=45&&a<135)return{pitch:gamma,roll:-beta};if(a>=135&&a<225)return{pitch:-beta,roll:-gamma};if(a>=225&&a<315)return{pitch:-gamma,roll:beta};return{pitch:beta,roll:gamma};}
 async enable(){
  if(this.active){this.active=false;this.calibrated=false;this.controls.x=this.controls.y=0;this.enableButton.textContent="ENABLE GYRO";this.state.textContent="STANDBY";this.message.textContent="Gyro steering paused";this.calibrateButton.disabled=true;this.render();return;}
  try{if(!("DeviceOrientationEvent"in window))throw new Error("This device does not provide motion sensors");if(typeof DeviceOrientationEvent.requestPermission==="function"){const p=await DeviceOrientationEvent.requestPermission();if(p!=="granted")throw new Error("Motion sensor permission was not granted");}
   window.addEventListener("deviceorientation",this.onOrientation,true);this.active=true;this.enableButton.textContent="DISABLE GYRO";this.state.textContent="WAITING";this.message.textContent="Keep the phone steady, then calibrate";this.calibrateButton.disabled=false;
   window.setTimeout(()=>{if(this.active&&!this.latest){this.state.textContent="NO SIGNAL";this.message.textContent="No sensor data. Check browser motion permissions."; }},1800);
  }catch(e){this.state.textContent="UNAVAILABLE";this.message.textContent=e?.message||"Motion sensor access failed";}
 }
 calibrate(){if(!this.latest){this.message.textContent="No sensor signal yet. Move the phone and retry.";return;}this.baseline={...this.latest};this.calibrated=true;this.filtered.pitch=this.filtered.roll=0;this.controls.x=this.controls.y=0;this.state.textContent="ACTIVE";this.message.textContent="Calibrated · tilt gently to steer";this.render();}
 render(){if(this.indicator)this.indicator.style.transform=`translate3d(${this.controls.x*24}px,${this.controls.y*24}px,0)`;}
 dispose(){window.removeEventListener("deviceorientation",this.onOrientation,true);window.removeEventListener("orientationchange",this.onScreenChange);window.screen?.orientation?.removeEventListener?.("change",this.onScreenChange);}
}