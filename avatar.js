/* Replace window.doctorAvatar with a Cubism adapter when a licensed rig is available.
   This renderer animates a single illustration; it is not a Cubism model. */
(() => {
  const frame = document.querySelector('#avatar');
  const canvas = document.querySelector('#avatar-canvas');
  const image = document.querySelector('#doctor-image');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let speakingUntil = 0, pointerX = 0, pointerY = 0, currentX = 0, currentY = 0;
  let voiceEnabled=false, dragging=false, dragged=false, dragStart=null, greetingIndex=0, statusTimer, animationId;
  const voiceButton=document.querySelector('#voice-toggle');
  const status=document.querySelector('#doctor-status');
  const greetings=['嗨，我在這裡。今天想聊聊，還是看看穴位地圖？','慢慢來，不用急著整理好。可以先說說今天的感受。','很高興你來照顧自己。下方的問題，也可以幫你開始對話。'];
  const setStatus=text=>{status.textContent=text;};
  function say(text){
    clearTimeout(statusTimer);
    speakingUntil = performance.now() + Math.min(6500, Math.max(1600, text.length * 65));
    frame.dataset.state='speaking';setStatus('知安正在回應你');
    document.querySelector('#stage-message').textContent = `「${text}」`;
    if(voiceEnabled&&'speechSynthesis' in window){
      speechSynthesis.cancel();
      const utterance=new SpeechSynthesisUtterance(text);utterance.lang='zh-TW';utterance.rate=.92;
      const voices=speechSynthesis.getVoices();
      utterance.voice=voices.find(v=>v.lang.toLowerCase()==='zh-tw')||voices.find(v=>v.lang.toLowerCase().startsWith('zh'))||null;
      utterance.onstart=()=>{speakingUntil=Infinity;};
      utterance.onend=utterance.onerror=()=>{speakingUntil=0;frame.dataset.state='idle';setStatus('知安在這裡，聽你說');};
      speechSynthesis.speak(utterance);
    }
    statusTimer=setTimeout(()=>{if(speakingUntil!==Infinity){frame.dataset.state='idle';setStatus('知安在這裡，聽你說');}},Math.max(1700,speakingUntil-performance.now()));
  }
  let gl, program, texture;
  window.doctorAvatar = {
    speak:say,
    stop() { speakingUntil=0;window.speechSynthesis?.cancel();frame.dataset.state='idle';setStatus('知安在這裡，聽你說'); },
    getState(){return {voiceEnabled,dragging,renderer:frame.classList.contains('webgl')?'webgl-illustration':'illustration'};}
  };
  function follow(event){
    const rect=frame.getBoundingClientRect();
    pointerX=Math.max(-1,Math.min(1,((event.clientX-rect.left)/rect.width-.5)*2));
    pointerY=Math.max(-1,Math.min(1,((event.clientY-rect.top)/rect.height-.5)*2));
  }
  frame.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    dragging=true;dragged=false;dragStart={x:event.clientX,y:event.clientY};
    frame.setPointerCapture(event.pointerId);frame.dataset.state='dragging';
  });
  frame.addEventListener('pointermove', event => {
    if(dragging&&dragStart&&Math.hypot(event.clientX-dragStart.x,event.clientY-dragStart.y)>7)dragged=true;
    follow(event);
  });
  function release(){dragging=false;dragStart=null;pointerX=0;pointerY=0;frame.dataset.state=performance.now()<speakingUntil?'speaking':'idle';}
  frame.addEventListener('pointerup',release);
  frame.addEventListener('pointercancel',()=>{dragged=true;release();});
  frame.addEventListener('lostpointercapture',release);
  frame.addEventListener('pointerleave',()=>{if(!dragging){pointerX=0;pointerY=0;}});
  function greet(){
    if(dragged){dragged=false;return;}
    frame.classList.remove('greeting');void frame.offsetWidth;frame.classList.add('greeting');
    document.querySelector('#touch-hint').textContent='知安收到你的招呼了 ✧';
    say(greetings[greetingIndex++%greetings.length]);
  }
  frame.addEventListener('click',greet);
  frame.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();dragged=false;greet();}});
  voiceButton.addEventListener('click',()=>{
    if(!('speechSynthesis' in window)){voiceButton.querySelector('span').textContent='裝置未支援';setStatus('這台裝置尚不支援語音，可繼續文字對話');return;}
    voiceEnabled=!voiceEnabled;
    voiceButton.setAttribute('aria-pressed',String(voiceEnabled));
    voiceButton.setAttribute('aria-label',voiceEnabled?'關閉角色語音':'開啟角色語音');
    voiceButton.querySelector('span').textContent=voiceEnabled?'語音開啟':'語音關閉';
    if(voiceEnabled)say('語音已開啟。我會把回應唸給你聽。');else window.doctorAvatar.stop();
  });
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error('Avatar shader unavailable');
    return s;
  }
  function init() {
    if (reducedMotion.matches) return;
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true });
      if (!gl) throw Error('WebGL unavailable');
      program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, 'attribute vec2 a_position; varying vec2 v_uv; void main(){v_uv=(a_position+1.0)*0.5;gl_Position=vec4(a_position,0,1);}'));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `precision mediump float;
        varying vec2 v_uv; uniform sampler2D u_image; uniform float u_time;
        uniform vec2 u_pointer; uniform float u_speaking; uniform vec2 u_size;
        void main(){
          vec2 uv=v_uv;
          float sway=sin(u_time*.7)*.004;
          float upper=smoothstep(.18,.82,uv.y);
          uv.x-=upper*(sway+u_pointer.x*.025);
          uv.y-=sin(u_time*1.5)*.0025*upper+u_pointer.y*.009*upper;
          uv.y-=sin(u_time*7.)*.0015*u_speaking*upper;
          float ratio=u_size.x/u_size.y;
          float imgRatio=${(1086/1448).toFixed(6)};
          if(ratio>imgRatio){uv.x=(uv.x-.5)*ratio/imgRatio+.5;}
          else{uv.y=uv.y*imgRatio/ratio;}
          if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){gl_FragColor=vec4(0.);}
          else{gl_FragColor=texture2D(u_image,uv);}
        }`));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Avatar program unavailable');
      gl.useProgram(program);
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      frame.classList.add('webgl');
      const loc = Object.fromEntries(['u_time','u_pointer','u_speaking','u_size'].map(key => [key,gl.getUniformLocation(program,key)]));
      function render(time) {
        if (reducedMotion.matches) { frame.classList.remove('webgl'); return; }
        if(gl.isContextLost())return;
        const dpr=Math.min(devicePixelRatio,2),w=Math.round(frame.clientWidth*dpr),h=Math.round(frame.clientHeight*dpr);
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
        currentX+=(pointerX-currentX)*.035; currentY+=(pointerY-currentY)*.035;
        const talking=time<speakingUntil;
        frame.classList.toggle('speaking',talking);
        gl.uniform1f(loc.u_time,time/1000);gl.uniform2f(loc.u_pointer,currentX,currentY);
        gl.uniform1f(loc.u_speaking,talking?1:0);gl.uniform2f(loc.u_size,w,h);
        gl.drawArrays(gl.TRIANGLES,0,6);
        animationId=requestAnimationFrame(render);
      }
      animationId=requestAnimationFrame(render);
    } catch { frame.classList.add('fallback'); }
  }
  if(image.complete&&image.naturalWidth) init(); else image.addEventListener('load',init,{once:true});
  reducedMotion.addEventListener('change',()=>{if(animationId)cancelAnimationFrame(animationId);frame.classList.remove('webgl','fallback');if(!reducedMotion.matches)init();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();frame.classList.remove('webgl');frame.classList.add('fallback');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)window.doctorAvatar.stop();});
  frame.dataset.state='idle';
})();
