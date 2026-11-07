(() => {
  'use strict';
  const panel = document.querySelector('#interaction-panel');
  const storageKey = 'gdi-health-journal-v1';
  const presets = ['我今天頭有點痛', '我今天肩膀有點緊', '我最近睡得不太好'];
  const ratings = ['沒有不適', '輕微', '明顯', '很痛'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const state = {view:'conversation',phase:'home',messages:[],choices:[],session:{},records:[],blocked:false,side:'左手',selected:null,maps:{左手:[],右手:[]},photos:{左手:null,右手:null},guided:false,guideIndex:0,surface:'palm',mapMode:'atlas',activeAcupoint:'PC8'};
  let storageAvailable = true, toastTimer;
  try { const saved=JSON.parse(localStorage.getItem(storageKey)||'[]'); state.records=Array.isArray(saved)?saved.filter(r=>r&&typeof r.id==='string'&&['conversation','map'].includes(r.type)):[]; }
  catch { storageAvailable=false; }
  document.querySelector('#today').textContent=new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',month:'long',day:'numeric',weekday:'short'}).format(new Date());
  function toast(text) {const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3200);}
  function speak(text){window.doctorAvatar?.speak(text);}
  function setView(view){
    state.view=view;
    document.body.dataset.view=view;
    document.querySelectorAll('[data-view]').forEach(button=>{button.classList.toggle('active',button.dataset.view===view);button.setAttribute('aria-current',button.dataset.view===view?'page':'false');});
    document.querySelector('#page-title').textContent={conversation:'留一點時間，給自己。',map:'把感受，輕輕標記下來。',journal:'每一次感受，都值得被記得。'}[view];
    render();
  }
  function header(title,subtitle,action='reset'){
    return `<div class="panel-top"><div><h2>${title}</h2><small>${subtitle}</small></div>${action?`<button class="icon-button" data-action="${action}" aria-label="${action==='reset'?'開始新的對話':'返回對話'}">${icon(action==='reset'?'plus':'chat')}</button>`:''}</div>`;
  }
  function composer(){return `<div class="panel-bottom"><form id="chat-form" class="composer"><input id="chat-input" aria-label="和知安說說你的感受" placeholder="也可以用自己的話，慢慢說…" autocomplete="off" maxlength="500" ${state.blocked?'disabled':''}><button class="send-button" aria-label="送出訊息" ${state.blocked?'disabled':''}>${icon('arrow')}</button></form><p class="input-hint">示範對話流程 · 不提供疾病診斷或治療處方</p></div>`;}
  function welcome(){return `<div class="welcome-label">你好，很高興見到你 <span aria-hidden="true">✧</span></div><h2 class="welcome-text">今天，想從<br>哪裡開始？</h2><p class="welcome-description">有些感受，值得被好好聽見。<br>不必等到不舒服，也能關心自己。</p><button class="entry-card" data-action="symptoms"><span class="entry-icon">${icon('chat')}</span><span class="entry-text"><strong>我有點不舒服</strong><small>聊聊症狀，一起整理身體的感受</small></span>${icon('arrow')}</button><button class="entry-card secondary" data-action="daily"><span class="entry-icon">${icon('hand')}</span><span class="entry-text"><strong>開始日常檢查</strong><small>伸出手掌，記錄今天每個點的感受</small></span>${icon('arrow')}</button><div class="chips-label">不知道怎麼開始？試著說</div><div class="chips">${presets.map((s,i)=>`<button class="chip" data-preset="${i}"><em aria-hidden="true">${['☁','〰','☾'][i]}</em>${s}</button>`).join('')}</div>`;}
  function renderConversation(){
    panel.innerHTML=header('和知安聊一聊','你的感受，我們一起慢慢整理')+`<div class="panel-body" id="messages" role="log" aria-live="polite" aria-label="對話紀錄">${state.phase==='home'?welcome():state.messages.map(message=>`<div class="message ${message.role}">${message.role==='assistant'?'<div class="message-name"><span class="mini-avatar">安</span>知安 · 示範回應</div>':''}<div class="bubble ${message.danger?'danger-bubble':''}">${esc(message.text)}</div></div>`).join('')+renderChoices()+ (state.phase==='summary'?summary():'')}</div>`+composer();
    if(state.phase!=='home'){const list=document.querySelector('#messages');list.scrollTop=list.scrollHeight;}
  }
  function renderChoices(){return state.choices.length?`<div class="choice-list" aria-label="快速回答">${state.choices.map((s,i)=>`<button class="chip" data-choice="${i}">${esc(s)}</button>`).join('')}</div>`:'';}
  function summary(){const s=state.session;return `<div class="summary-card"><h3>本次感受摘要</h3>${[['主要感受',s.complaint],['位置',s.location],['開始時間',s.onset],['不適程度',s.severity],['其他感受',s.associated]].map(([label,value])=>`<div class="summary-row"><span>${label}</span><span>${esc(value)}</span></div>`).join('')}<p class="map-note">這是你描述的感受，不代表診斷結果。保存後僅留在此瀏覽器，請避免在共用裝置留下私人健康資訊。</p><button class="primary-button" data-action="save-conversation">${icon('book')}儲存這次紀錄</button><button class="text-button" data-action="daily">也想記錄手部感受 →</button></div>`;}
  function assistant(text,choices=[]){state.messages.push({role:'assistant',text});state.choices=choices;speak(text);renderConversation();}
  function isUrgent(text){
    const cleaned=text.replace(/(?:沒有|無|否認|不是|並無|沒有出現|沒有感到)(?:任何)?(?:胸痛|胸悶|呼吸困難|喘不過氣|單側無力|口齒不清|昏倒|突然劇烈頭痛)/g,'');
    return /(胸痛|胸悶|喘不過氣|呼吸困難|突然.*(?:無力|麻木|劇烈頭痛)|口齒不清|昏倒|生平最痛|心臟.*痛)/.test(cleaned);
  }
  function beginComplaint(text){
    state.phase='location';state.session={complaint:text};state.choices=[];
    const choices=/肩/.test(text)?['左邊肩膀','右邊肩膀','兩邊都有']:/頭/.test(text)?['額頭附近','左側頭部','右側頭部','整個頭部']:/睡/.test(text)?['不容易入睡','容易半夜醒來','睡醒還是累']:['我想描述位置','沒有固定位置'];
    assistant(/睡/.test(text)?'我聽到了。最近睡眠比較困擾你的是哪一種情況？':'我聽到了。可以告訴我，主要是哪個位置嗎？',choices);
  }
  function send(text){
    text=text.trim();if(!text||state.blocked)return;
    if(state.view!=='conversation')setView('conversation');
    state.messages.push({role:'user',text});state.choices=[];
    if(isUrgent(text)){
      state.phase='urgent';state.blocked=true;
      state.messages.push({role:'assistant',danger:true,text:'你提到的症狀可能需要緊急評估。請停止設備操作，立即尋求醫療協助；在台灣可撥打 119。不要用手部測點或電刺激來判斷、等待症狀改善。這個原型無法提供急症評估。'});
      speak('先把安全放在第一位，請立即尋求醫療協助。');renderConversation();return;
    }
    if(['home','choose','summary'].includes(state.phase)){beginComplaint(text);return;}
    if(state.phase==='location'){
      if(text==='我想描述位置'){assistant('可以直接在下方輸入，告訴我主要在哪個位置。');return;}
      state.session.location=text;state.phase='onset';assistant('大概是從什麼時候開始的？',['今天才開始','這兩三天','已經超過一週']);
    }else if(state.phase==='onset'){
      state.session.onset=text;state.phase='severity';assistant('現在的不舒服有多明顯？也可以直接輸入 0～10 分，0 分是沒有不適。',['輕微（1–3 分）','中等（4–6 分）','明顯（7–10 分）']);
    }else if(state.phase==='severity'){
      state.session.severity=text;state.phase='associated';assistant('除了剛才的感受，還有其他不舒服嗎？若有胸痛、呼吸困難或突然單側無力，請直接就醫。',['沒有其他不適','還想補充一些感受']);
    }else if(state.phase==='associated'){
      if(text==='還想補充一些感受'){assistant('我在這裡。可以用自己的話，把其他感受寫在下方。');return;}
      state.session.associated=text;state.phase='summary';assistant('謝謝你告訴我。我把這次的感受整理好了，你可以保存並在下次回顧。若症狀持續、加重或影響生活，請安排醫療評估。');
    }else{assistant('這個版本使用預設示範流程。你可以開始一段新的對話，或到健康日誌查看已保存的紀錄。');}
  }
  function symptoms(){state.phase='choose';state.blocked=false;state.messages=[];assistant('今天哪裡不太舒服呢？選一個感受，或直接在下方告訴我。',presets);}
  function reset(){state.phase='home';state.messages=[];state.choices=[];state.session={};state.blocked=false;setView('conversation');speak('今天感覺怎麼樣？我們一起整理一下。');}
  function persist(record){
    const next=[record,...state.records];
    try{localStorage.setItem(storageKey,JSON.stringify(next));state.records=next;storageAvailable=true;toast('已儲存在此瀏覽器的健康日誌');setView('journal');}
    catch{storageAvailable=false;toast('瀏覽器無法儲存紀錄。請確認儲存空間或隱私設定。');}
  }
  function saveConversation(){persist({id:crypto.randomUUID(),type:'conversation',date:new Date().toISOString(),title:state.session.complaint,details:{...state.session}});}
  const atlas=window.handAtlas;
  const surfaceName=()=>state.surface==='palm'?'手掌':'手背';
  const photoKey=()=>state.side+'-'+state.surface;
  const currentPhoto=()=>state.photos[photoKey()];
  const surfacePoints=()=>atlas.points.filter(p=>p.surface===state.surface);
  const visiblePoints=()=>state.maps[state.side].filter(p=>(p.surface||'palm')===state.surface&&(p.mode||'atlas')===state.mapMode);
  const activePoint=()=>surfacePoints().find(p=>p.id===state.activeAcupoint)||surfacePoints()[0];
  function daily(){
    state.guided=true;state.guideIndex=0;state.selected=null;state.surface='palm';state.mapMode='atlas';state.activeAcupoint='PC8';setView('map');
    speak('先看看手掌上的穴位參考位置。選擇一個點，就能查看解剖定位並記錄自己的感受。');
  }
  function chooseAcupoint(id){
    const point=atlas.points.find(p=>p.id===id);if(!point)return;
    state.activeAcupoint=id;state.surface=point.surface;state.mapMode='atlas';state.guided=false;
    state.selected=state.maps[state.side].find(p=>p.acupointId===id&&p.mode==='atlas')?.id||null;
    speak(point.name+'，'+point.location);renderMap();
  }
  function pointDetails(point){
    return `<div class="acupoint-detail"><div class="acupoint-detail-heading"><div><span class="point-kind">標準經穴 · 定位參考</span><h3>${point.name} <span>${point.id}</span></h3></div><span class="meridian-label">${point.meridian}</span></div><p>${point.location}</p><div class="landmark-note">${point.landmark}</div></div>`;
  }
  function renderMap(){
    const points=visiblePoints(),point=activePoint();
    const selected=state.mapMode==='atlas'?points.find(p=>p.acupointId===point.id):points.find(p=>p.id===state.selected);
    const photo=currentPhoto(),isAtlas=state.mapMode==='atlas';
    const instruction=isAtlas?`${point.name} ${point.id}：記錄你的感受`:(selected?'個人標記 '+(points.indexOf(selected)+1)+'：這裡的感受是？':'先在照片上點選位置，再記錄感受');
    panel.innerHTML=header('我的穴位地圖','選一個穴位，看看它在哪裡','back')+`<div class="panel-body map-body view-enter">
      <div class="map-controls"><div class="segmented" aria-label="選擇手掌">${['左手','右手'].map(side=>`<button data-side="${side}" class="${state.side===side?'selected':''}" aria-pressed="${state.side===side}">${side}</button>`).join('')}</div><div class="segmented" aria-label="選擇手面">${[['palm','手掌'],['back','手背']].map(([value,name])=>`<button data-surface="${value}" class="${state.surface===value?'selected':''}" aria-pressed="${state.surface===value}">${name}</button>`).join('')}</div></div>
      <div class="map-mode-tabs" aria-label="地圖模式"><button data-map-mode="atlas" class="${isAtlas?'selected':''}" aria-pressed="${isAtlas}">穴位參考圖</button><button data-map-mode="photo" class="${!isAtlas?'selected':''}" aria-pressed="${!isAtlas}">我的手部照片</button><span>${isAtlas?'4 個穴位':'手動標記'}</span></div>
      ${isAtlas?`<div class="hand-area atlas-area">${atlas.render({side:state.side,surface:state.surface,active:point.id,recorded:points.filter(p=>p.rating).map(p=>p.acupointId)})}</div>${pointDetails(point)}`:`<div class="hand-area photo-area" id="hand-area">${photo?`<img class="hand-photo" src="${photo}" alt="本次上傳的${state.side}${surfaceName()}照片"><div class="map-surface" id="map-surface" role="group" aria-label="個人照片標記區">${points.map((p,i)=>`<button class="marker ${p.id===state.selected?'selected':''}" style="left:${p.x}%;top:${p.y}%" data-marker="${p.id}" aria-label="個人標記 ${i+1}，${p.rating||'尚未記錄感受'}">${i+1}</button>`).join('')}</div><span class="photo-tag">僅本次暫存 · 不會自動定位穴位</span>`:`<label class="photo-empty" for="photo-input">${icon('upload')}<strong>放上你的${state.side}${surfaceName()}照片</strong><span>點選上傳，開始手動標記感受</span></label>`}</div><label class="upload-label photo-upload">${icon('upload')}${photo?'更換照片':'選擇照片'}<input id="photo-input" type="file" accept="image/jpeg,image/png,image/webp"></label><p class="map-note">個人照片不會自動套上穴位；請先對照參考圖，再自行標記。照片只在本頁暫存。</p>`}
      <div class="map-instruction"><span>${instruction}</span><div class="rating-options">${ratings.map(r=>`<button class="rating-button ${selected?.rating===r?'selected':''}" data-rating="${r}" ${!isAtlas&&!selected?'disabled':''}>${r}</button>`).join('')}</div></div>
      ${!isAtlas&&photo?'<button class="chip" data-action="add-marker">＋ 新增個人標記</button>':''}
      ${points.some(p=>['明顯','很痛'].includes(p.rating))?'<p class="pain-notice" role="status">出現明顯疼痛，請停止該處操作。若不適持續或加重，請尋求醫療評估。</p>':''}
      ${points.length?`<div class="point-list">${points.map((p,i)=>`<div class="point-row"><span>${esc(p.name||'個人標記 '+(i+1))}${p.acupointId?' · '+p.acupointId:''}</span><span>${p.rating||'待記錄'} <button class="delete-button" data-remove-marker="${p.id}" aria-label="刪除${esc(p.name||'標記 '+(i+1))}">×</button></span></div>`).join('')}</div>`:''}
      <button class="primary-button" data-action="save-map" ${!points.length||points.some(p=>!p.rating)?'disabled':''}>${icon('book')}儲存${state.side}${surfaceName()}紀錄${points.length?' · '+points.length+' 個位置':''}</button>
      <p class="map-note atlas-disclaimer">穴位圖為解剖定位示意，非個人精準定位或電刺激處方。經絡名稱屬傳統分類，測點疼痛不能用來判斷對應器官的疾病或嚴重程度。</p>
      <details class="atlas-reference"><summary>關於穴位資料與產品反應區</summary><p>本圖顯示 8 個常見標準經穴的名稱、代碼與解剖定位參考，手掌／手背各 4 個。位置示意尚須由合格中醫師校對，不應直接作為設備操作依據。原廠手診圖中的器官反應區屬不同系統，未混入標準穴位，也未用來推斷器官狀況。</p></details>
    </div>`;
    document.querySelector('#photo-input')?.addEventListener('change',uploadPhoto);
    document.querySelector('#map-surface')?.addEventListener('click',event=>{
      if(event.target.closest('[data-marker]'))return;
      const rect=event.currentTarget.getBoundingClientRect();addMarker((event.clientX-rect.left)/rect.width*100,(event.clientY-rect.top)/rect.height*100);
    });
  }
  function addMarker(x=50,y=60){
    if(state.mapMode!=='photo'||!currentPhoto()){toast('請先上傳自己的手部照片');return;}
    const point={id:crypto.randomUUID(),x:Math.round(x*100)/100,y:Math.round(y*100)/100,rating:null,surface:state.surface,mode:'photo'};
    state.maps[state.side].push(point);state.selected=point.id;state.guided=false;renderMap();
  }
  function rate(rating){
    const points=visiblePoints();let point;
    if(state.mapMode==='atlas'){
      const ref=activePoint();point=points.find(p=>p.acupointId===ref.id);
      if(!point){point={id:crypto.randomUUID(),acupointId:ref.id,name:ref.name,surface:ref.surface,mode:'atlas',rating:null};state.maps[state.side].push(point);}
    }else{
      point=points.find(p=>p.id===state.selected);
      if(!point){toast('請先在照片上新增或選擇一個標記');return;}
    }
    point.rating=rating;
    if(['明顯','很痛'].includes(rating)){
      state.guided=false;state.selected=point.id;
      speak('先停止這個位置的操作。測點疼痛不能判斷器官狀況；如果不適持續，請尋求醫療評估。');
    }else if(state.guided){
      state.guideIndex++;state.selected=null;
      if(state.guideIndex<surfacePoints().length){state.activeAcupoint=surfacePoints()[state.guideIndex].id;speak('記下來了。接下來可以查看'+activePoint().name+'的定位參考。');}
      else{state.guided=false;speak('今天的感受記錄好了，可以保存並在下次回顧。');}
    }
    renderMap();
  }
  function uploadPhoto(event){
    const file=event.target.files[0];if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){toast('請選擇 JPG、PNG 或 WebP 圖片');return;}
    if(file.size>10*1024*1024){toast('請選擇 10 MB 以下的圖片');return;}
    const side=state.side,surface=state.surface,key=photoKey(),url=URL.createObjectURL(file),test=new Image();
    test.onload=()=>{
      const previous=state.maps[side].filter(p=>p.mode==='photo'&&p.surface===surface);
      if(previous.length&&!confirm('更換照片會清除此手面尚未保存的個人標記，避免位置錯置。要繼續嗎？')){URL.revokeObjectURL(url);return;}
      if(state.photos[key])URL.revokeObjectURL(state.photos[key]);
      state.photos[key]=url;state.maps[side]=state.maps[side].filter(p=>!(p.mode==='photo'&&p.surface===surface));state.selected=null;state.guided=false;
      if(state.view==='map'&&state.side===side&&state.surface===surface)renderMap();toast('照片僅在本頁暫存，請點選位置開始標記');
    };
    test.onerror=()=>{URL.revokeObjectURL(url);toast('無法讀取這張圖片，請換一張照片');};test.src=url;
  }
  function saveMap(){
    const points=visiblePoints();if(!points.length||points.some(p=>!p.rating)){toast('請先完成標記的感受紀錄');return;}
    persist({id:crypto.randomUUID(),type:'map',date:new Date().toISOString(),title:state.side+surfaceName()+'感受紀錄',details:{side:state.side,surface:state.surface,mode:state.mapMode,source:state.mapMode==='photo'?'個人照片手動標記（未保存照片）':'標準穴位定位參考圖',points:points.map(p=>({...p}))}});
  }
  function renderJournal(){
    panel.innerHTML=header('我的健康日誌','把今天的感受，留給下次的自己','back')+`<div class="panel-body view-enter"><p class="journal-privacy">紀錄僅儲存在此瀏覽器，沒有上傳雲端。清除瀏覽器資料會一併刪除紀錄，請勿當作正式病歷備份。${storageAvailable?'':'目前瀏覽器儲存功能不可用。'}</p>${!state.records.length?`<div class="empty-state">${icon('book')}<h3>從今天的第一筆開始。</h3><p>和知安聊聊，或記錄手部感受。<br>保存後，就能在這裡回顧。</p><button class="primary-button" data-action="daily">開始日常檢查</button></div>`:state.records.map(record=>{
      const date=new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(record.date));
      const d=record.details;
      const details=record.type==='conversation'?`位置：${d.location}\n開始時間：${d.onset}\n不適程度：${d.severity}\n其他感受：${d.associated}`:`${d.source}\n${d.points.map((p,i)=>`${p.name?p.name+' '+p.acupointId:'個人標記 '+(i+1)}：${p.rating}`).join(' · ')}`;
      return `<article class="record"><span class="record-date">${date} · ${record.type==='map'?'手部感受':'對話紀錄'}</span><h3>${esc(record.title)}</h3><p>${esc(details)}</p><div class="record-actions"><span class="record-date">個人回報，非診斷結果</span><button class="delete-button" data-delete="${esc(record.id)}">刪除紀錄</button></div></article>`;
    }).join('')}</div>`;
  }
  function render(){({conversation:renderConversation,map:renderMap,journal:renderJournal})[state.view]();}
  document.addEventListener('click',event=>{
    const acupoint=event.target.closest('[data-acupoint]');if(acupoint){chooseAcupoint(acupoint.dataset.acupoint);return;}
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.view){setView(button.dataset.view);return;}
    if(button.dataset.preset!==undefined){send(presets[Number(button.dataset.preset)]);return;}
    if(button.dataset.choice!==undefined){send(state.choices[Number(button.dataset.choice)]);return;}
    if(button.dataset.side){state.side=button.dataset.side;state.selected=null;state.guideIndex=0;state.activeAcupoint=surfacePoints()[0].id;renderMap();return;}
    if(button.dataset.surface){state.surface=button.dataset.surface;state.selected=null;state.guided=false;state.activeAcupoint=surfacePoints()[0].id;renderMap();return;}
    if(button.dataset.mapMode){state.mapMode=button.dataset.mapMode;state.selected=null;state.guided=false;renderMap();return;}
    if(button.dataset.rating){rate(button.dataset.rating);return;}
    if(button.dataset.marker){state.selected=button.dataset.marker;state.guided=false;renderMap();return;}
    if(button.dataset.removeMarker){state.maps[state.side]=state.maps[state.side].filter(p=>p.id!==button.dataset.removeMarker);state.selected=null;renderMap();return;}
    if(button.dataset.delete){
      if(confirm('確定刪除這筆健康紀錄？此操作無法復原。')){
        const next=state.records.filter(r=>r.id!==button.dataset.delete);
        try{localStorage.setItem(storageKey,JSON.stringify(next));state.records=next;renderJournal();toast('已刪除紀錄');}catch{toast('刪除失敗，請確認瀏覽器儲存設定');}
      }return;
    }
    ({reset,symptoms,daily,back:()=>setView('conversation'),'save-conversation':saveConversation,'save-map':saveMap,'add-marker':()=>addMarker()})[button.dataset.action]?.();
  });
  document.addEventListener('submit',event=>{if(event.target.id==='chat-form'){event.preventDefault();const input=document.querySelector('#chat-input');const value=input.value;send(value);}});
  document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();setView('conversation');});
  document.addEventListener('keydown',event=>{const point=event.target.closest('[data-acupoint]');if(point&&['Enter',' '].includes(event.key)){event.preventDefault();chooseAcupoint(point.dataset.acupoint);requestAnimationFrame(()=>document.querySelector('[data-acupoint="'+point.dataset.acupoint+'"]')?.focus());}});
  function updateViewport(){if(window.visualViewport?.scale===1)document.documentElement.style.setProperty('--viewport-height',window.visualViewport.height+'px');}
  window.visualViewport?.addEventListener('resize',updateViewport);
  window.addEventListener('resize',updateViewport);
  document.addEventListener('focusin',event=>{if(event.target.id==='chat-input')document.body.classList.add('input-focused');});
  document.addEventListener('focusout',()=>requestAnimationFrame(()=>document.body.classList.toggle('input-focused',document.activeElement?.id==='chat-input')));
  updateViewport();
  document.body.dataset.view='conversation';
  render();
})();
