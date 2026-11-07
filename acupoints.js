/* Educational anatomical reference, not device instructions or an organ test.
 * Coordinates refer only to the illustration below, never to uploaded photos.
 * Clinical review is required before using this prototype for point location.
 */
(() => {
  const points = [
    {id:'PC8',name:'勞宮',surface:'palm',meridian:'手厥陰心包經',x:168,y:266,labelX:22,labelY:242,location:'手掌面，第 2、3 掌骨之間，偏第 3 掌骨側，約在掌指關節近端。',landmark:'可用握拳時中指尖接近的掌心位置輔助理解；仍須依掌骨定位。'},
    {id:'LU10',name:'魚際',surface:'palm',meridian:'手太陰肺經',x:112,y:299,labelX:22,labelY:322,location:'拇指側，第 1 掌骨中點的橈側，赤白肉際處。',landmark:'赤白肉際是手掌與手背皮膚交界；不是整片大魚際的中央。'},
    {id:'PC7',name:'大陵',surface:'palm',meridian:'手厥陰心包經',x:179,y:374,labelX:22,labelY:398,location:'腕掌側橫紋上，掌長肌腱與橈側腕屈肌腱之間。',landmark:'以腕橫紋及肌腱為定位標誌；個別人的掌長肌腱可能不明顯。'},
    {id:'HT7',name:'神門',surface:'palm',meridian:'手少陰心經',x:223,y:367,labelX:338,labelY:370,location:'腕掌側橫紋尺側端，尺側腕屈肌腱橈側緣，豌豆骨近端的凹陷處。',landmark:'在小指側的手腕附近；與腕橫紋中央的大陵不同。'},
    {id:'LI4',name:'合谷',surface:'back',meridian:'手陽明大腸經',x:135,y:278,labelX:22,labelY:304,location:'手背，第 1、2 掌骨之間，第 2 掌骨中點的橈側。',landmark:'以第 2 掌骨的中點及拇指側為準，不是虎口皮膚邊緣。'},
    {id:'LI3',name:'三間',surface:'back',meridian:'手陽明大腸經',x:131,y:229,labelX:22,labelY:230,location:'食指橈側，第 2 掌指關節近端的凹陷處，赤白肉際。',landmark:'微握拳可協助辨認食指指根關節；位置在關節靠手腕的一側。'},
    {id:'TE3',name:'中渚',surface:'back',meridian:'手少陽三焦經',x:223,y:277,labelX:338,labelY:247,location:'手背，第 4、5 掌骨之間，第 4 掌指關節近端的凹陷處。',landmark:'在無名指與小指的掌骨之間；不是指縫本身。'},
    {id:'SI3',name:'後溪',surface:'back',meridian:'手太陽小腸經',x:246,y:290,labelX:338,labelY:324,location:'手的尺側，第 5 掌指關節近端，赤白肉際的凹陷處。',landmark:'微握拳時，小指側掌橫紋盡頭附近；這裡用手背斜側示意。'}
  ];
  function mirrored(side,surface){return surface==='palm'?side==='左手':side==='右手';}
  function render({side,surface,active,recorded=[]}){
    const flip=mirrored(side,surface),transform=flip?'transform="translate(360 0) scale(-1 1)"':'';
    const palm=surface==='palm';
    return `<svg class="acupoint-atlas" viewBox="0 0 360 440" role="group" aria-label="${side}${palm?'手掌':'手背'}穴位定位參考圖"><defs><linearGradient id="atlas-skin" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f7e6d0"/><stop offset="1" stop-color="#dfc2a1"/></linearGradient></defs><g ${transform}><path d="M142 420c2-25-5-55-24-80L73 267c-10-16-18-38-6-43 12-7 23 15 40 27l10 8-16-137c-2-17 19-21 22-3l14 100-5-146c-1-19 22-21 24-2l8 140 9-164c2-18 24-16 25 3l-4 163 23-128c3-19 25-12 22 6l-14 138 24-78c5-17 25-9 21 8l-20 123c-3 34-21 61-26 81l-3 57" fill="url(#atlas-skin)" stroke="#c6ab88" stroke-width="1.1"/>
      ${palm?'<path d="M116 257c29 3 46 30 40 61m-16-85c21 22 49 28 87 13m-83 72c19-19 49-23 76-15m-78 69c23 9 51 9 82-5m-79 16c21 5 50 7 76-1" fill="none" stroke="#c5a47e" stroke-width="1.15" opacity=".65"/>':'<g fill="none" stroke="#bd9d78" stroke-width="1.1" opacity=".5"><path d="m139 237 19 130m48-130-10 131m33-105-20 106m-38-138 6 137"/><path d="M133 229q8-5 15 0m28-9q9-4 17 0m22 18q8-4 13 1m12 25q6-3 10 1M144 376q35 8 78-3"/><path d="M135 83h16m26-22h17m25 34h15m20 67h12"/></g>'}
      <g fill="none" stroke="#c5a47e" stroke-width="1" opacity=".45"><path d="m109 150 16-2m13-36 17-1m22-19 19 1m14 36 19 3m18 57 18 4"/></g></g>
      <text x="180" y="18" text-anchor="middle" class="atlas-orientation">${side} · ${palm?'掌心朝向自己':'手背朝向自己'}</text>
      ${points.filter(p=>p.surface===surface).map(p=>{
        const x=flip?360-p.x:p.x,lx=flip?360-p.labelX:p.labelX,left=lx<180,end=left?lx+47:lx-47;
        const selected=p.id===active,done=recorded.includes(p.id);
        return `<g class="atlas-point ${selected?'active':''} ${done?'recorded':''}" data-acupoint="${p.id}" tabindex="0" role="button" aria-label="${p.name} ${p.id}，查看定位${done?'，已記錄感受':''}" aria-pressed="${selected}"><title>${p.name} ${p.id}：${p.location}</title><path class="atlas-leader" d="M${x} ${p.y} L${end} ${p.labelY-2} H${lx}"/><circle class="atlas-hit" cx="${x}" cy="${p.y}" r="20"/><circle class="atlas-halo" cx="${x}" cy="${p.y}" r="12"/><circle class="atlas-dot" cx="${x}" cy="${p.y}" r="4.5"/><rect x="${left?lx-4:lx-49}" y="${p.labelY-19}" width="57" height="44" rx="5" fill="transparent"/><text x="${lx}" y="${p.labelY}" text-anchor="${left?'start':'end'}" class="atlas-name">${p.name}</text><text x="${lx}" y="${p.labelY+15}" text-anchor="${left?'start':'end'}" class="atlas-code">${p.id}${done?' · 已記錄':''}</text></g>`;
      }).join('')}</svg>`;
  }
  window.handAtlas={points,render,mirrored};
})();
