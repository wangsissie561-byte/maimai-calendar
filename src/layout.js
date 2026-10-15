(function(root,factory){const api=factory();if(typeof module!=='undefined')module.exports=api;else root.MaiLayout=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SIZES={small:{width:170,height:170},medium:{width:360,height:170},large:{width:360,height:380}};
  // Shared deterministic drawing plan; both browser and Scriptable render this exact plan.
  function plan(model,family,core){
    family=SIZES[family]?family:'medium';
    const size=SIZES[family],w=size.width,h=size.height,c=model.colors,ops=[];
    const text=(value,x,y,width,height,font,color,bold,align)=>ops.push({kind:'text',value:String(value),x,y,width,height,font,color:color||c.ink,bold:!!bold,align:align||'left'});
    const ellipse=(x,y,width,height,color)=>ops.push({kind:'ellipse',x,y,width,height,color});
    const rect=(x,y,width,height,color)=>ops.push({kind:'rect',x,y,width,height,color});
    if(model.theme.special==='birthday'){
      const ink='#51362B',pink='#FCEAE3';
      ops.push({kind:'background',color:'#FFFCF5'});
      const art=(x,y,side)=>ops.push({kind:'image',name:'birthday-v2',x,y,width:side,height:side});
      const greeting=(x,y,font,width)=>{
        text('祝你',x,y,width,font+7,font,ink,true);
        text('生日快乐！',x,y+font+5,width,font+7,font,ink,true);
      };
      const date=(x,y,font)=>{
        text(model.date.day,x,y,65,font+7,font,ink,true);
        text(`${model.date.month}月 · 周${model.weekday}`,x,y+font+8,100,18,10,ink,false);
      };
      if(family==='small'){
        ellipse(34,68,111,96,pink);art(37,70,98);
        greeting(13,12,20,108);
        text(model.date.day,128,14,35,31,25,ink,true);
        text(`${model.date.month}月`,130,47,31,12,9,ink,false);
        text(`周${model.weekday}`,130,60,31,12,9,ink,false);
      }else if(family==='medium'){
        ellipse(205,13,143,143,pink);art(190,9,160);
        greeting(20,23,29,176);date(22,111,28);
      }else{
        ellipse(204,14,140,140,pink);art(194,9,157);
        greeting(21,19,29,180);date(23,107,27);
        rect(21,170,318,0.7,'#EADFD4');
        text(`${model.date.year}年${model.date.month}月`,23,180,220,23,17,ink,true);
        const box=45,start=22.5,rows=model.month.length/7,rh=Math.min(29,150/rows);
        core.WEEKDAYS.forEach((day,i)=>text(day,start+i*box,210,box,17,11,i>4?'#D97868':ink,false,'center'));
        model.month.forEach((key,i)=>{
          if(!key)return;
          const x=start+(i%7)*box,y=234+Math.floor(i/7)*rh,selected=key===model.dateKey;
          if(selected)ellipse(x+(box-25)/2,y-3,25,25,pink);
          text(core.dateParts(key).day,x,y,box,21,14,selected?'#A83E30':ink,selected,'center');
        });
      }
      return {size,ops};
    }
    ops.push({kind:'background',color:c.background});
    // A few soft background patches and a quiet gingham corner, never behind the summary.
    ellipse(w-85,-37,120,85,c.wash);ellipse(-30,h-75,80,56,c.wash);
    if(model.theme.skin==='picnic')for(let row=0;row<5;row++)for(let col=0;col<5;col++)if(row+col>4)rect(w-50+col*10,h-50+row*10,10,10,(row+col)%2?'#F6DDD2':'#FBECE4');
    const hero=(x,y,width,height)=>ops.push({kind:'image',name:model.theme.hero,x,y,width,height});
    const marker=(key,x,y,box)=>{
      let icon=key===model.dateKey&&model.theme.icon?model.theme.icon:!model.stale&&model.days[key]&&model.days[key].icon;
      if(icon)text(core.MARKS[icon]||'✦',x,y,box,14,11,c.ink,false,'center');
    };
    function cell(key,x,y,box,rowHeight){
      if(!key)return;
      const selected=key===model.dateKey,day=core.dateParts(key).day;
      if(selected)ellipse(x+(box-25)/2,y-2,25,25,c.accent);
      text(day,x,y,box,23,15,selected?'#FFFFFF':c.ink,false,'center');
      marker(key,x,y+23,box);
    }
    if(family==='small'){
      text(model.date.day,13,12,105,79,68,c.ink,true);
      text(`${model.date.month}月 · 周${model.weekday}`,16,90,120,20,12,c.ink,true);
      hero(84,58,84,84);
      if(model.summarySmall)text(model.summarySmall,16,146,139,17,10.5,c.muted,false);
    }else if(family==='medium'){
      text(model.date.day,16,27,90,80,72,c.ink,true);
      text(`${model.date.month}月 · 周${model.weekday}`,19,108,94,20,12,c.ink,true);
      rect(114,31,0.65,93,'#E7D8C6');
      const start=128,box=30;
      core.WEEKDAYS.forEach((day,i)=>text(day,start+i*box,39,box,18,11,c.muted,false,'center'));
      model.week.forEach((key,i)=>cell(key,start+i*box,67,box,45));
      if(model.summary)text(core.shortText(model.summary,25),19,142,w-38,17,11,c.muted,false);
    }else{
      text(`${model.date.year}年${model.date.month}月`,22,31,245,36,25,c.ink,true);
      hero(w-94,7,86,86);
      const start=18,box=(w-36)/7,rows=model.month.length/7,rowHeight=Math.min(42,210/rows);
      core.WEEKDAYS.forEach((day,i)=>text(day,start+i*box,100,box,20,12,c.muted,false,'center'));
      model.month.forEach((key,i)=>cell(key,start+(i%7)*box,132+Math.floor(i/7)*rowHeight,box,rowHeight));
      if(model.summary)text(core.shortText(model.summary,26),23,h-35,w-46,19,12,c.muted,false);
    }
    return {size,ops};
  }
  return {SIZES,plan};
});
