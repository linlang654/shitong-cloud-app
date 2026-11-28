/* Mobile presentation layer; delegates every business action to the existing app. */
(() => {
 const role=document.body.dataset.appMode;if(!['factory','courier'].includes(role))return;
 const $=id=>document.getElementById(id), workspace=document.querySelector('.workspace'), mq=matchMedia('(max-width: 760px)');
 const el=(tag,cls,txt)=>{const n=document.createElement(tag);n.className=cls;if(txt)n.textContent=txt;return n};
 const scrollToTop=()=>window.scrollTo({top:0,behavior:'instant'});
 const bar=el('nav','mobile-role-nav');bar.setAttribute('aria-label','手机工作台导航');workspace.append(bar);
 const tabs=[];function tab(key,icon,label,action){const b=el('button','mobile-nav-btn');b.type='button';b.dataset.mobileTab=key;b.append(el('span','mobile-nav-icon',icon),el('span','',label));b.onclick=action;bar.append(b);tabs.push(b);return b}
 function active(key){tabs.forEach(b=>{const on=b.dataset.mobileTab===key;b.classList.toggle('selected',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
 if(role==='factory'){
  const scanner=document.querySelector('.scanner-panel'),daily=document.querySelector('.factory-daily-panel'),pending=$('factoryPendingPanel');
  scanner.dataset.mobileView='scan';daily.dataset.mobileView='daily';pending.dataset.mobileView='pending';
  const actions=document.querySelector('.factory-batch-actions');
  // Keep the original submit button inside its original container, anchored by CSS.
  const indicator=el('div','mobile-batch-indicator');const jump=el('button','ghost mobile-queue-jump','查看待提交明细');jump.type='button';jump.onclick=()=>document.querySelector('.factory-scan-queue-panel').scrollIntoView({behavior:'smooth',block:'start'});indicator.append(jump,el('strong','','0 件'));actions.prepend(indicator);
  const count=$('factoryQueueCount');new MutationObserver(()=>{indicator.lastChild.textContent=count.textContent}).observe(count,{childList:true,subtree:true,characterData:true});
  const note=el('p','mobile-step-note','① 选入库 / 出库　② 扫码　③ 核对并提交');document.querySelector('.scanner-heading').after(note);
  const manual=document.querySelector('.factory-manual-scan');const camera=$('factoryCameraToggleBtn');manual.before(camera);
  const history=document.querySelector('.scan-history-panel'), detail=el('details','mobile-history');detail.append(el('summary','','最近处理记录'));history.before(detail);detail.append(history);detail.open=!mq.matches;
  const exceptions=$('factoryExceptionDialog');
  function stopCamera(){
    if(workspace.dataset.mobileView==='scan'&&!$('factoryCameraPanel').classList.contains('hidden'))$('factoryCameraToggleBtn').click();
  }
  function view(key){if(exceptions.open)exceptions.close();if(key!=='scan')stopCamera();workspace.dataset.mobileView=key;active(key);if(key==='daily'){if(daily.classList.contains('is-collapsed'))$('factoryDailyCollapseBtn').click();}if(key==='pending')pending.open=true;scrollToTop()}
  tab('scan','▣','扫码作业',()=>view('scan'));tab('daily','▤','今日清单',()=>view('daily'));tab('pending','☷','待办物品',()=>view('pending'));const ex=tab('exception','!','异常工单',()=>$('factoryExceptionBtn').click());
  new MutationObserver(()=>{
    if(exceptions.open&&mq.matches){
      stopCamera();
      active('exception');
    }else{
      active(workspace.dataset.mobileView);
    }
  }).observe(exceptions,{attributes:true,attributeFilter:['open']});
  const badge=el('span','mobile-nav-count');
  ex.append(badge);
  const workCount=$('factoryExceptionWorkCount');
  const sync=()=>{
    const count=workCount.classList.contains('hidden')?0:Number(workCount.textContent.match(/\d+/)?.[0])||0;
    badge.textContent=count?String(count):'';
    badge.hidden=!count;
  };
  new MutationObserver(sync).observe(workCount,{attributes:true,childList:true,subtree:true,characterData:true});
  sync();
  view('scan');
 }else{
  const filter=document.querySelector('.courier-filterbar'), history=el('details','mobile-history-filter');history.append(el('summary','','历史日期 / 全部未完成'));filter.append(history);history.append(filter.querySelector('.date-filter'),$('courierTodayBtn'));history.open=!mq.matches;mq.addEventListener('change',()=>{history.open=!mq.matches});
  const list=$('courierRouteTaskList');const search=$('courierSearch');search.placeholder='姓名 / 电话 / 楼栋 / 水洗标';search.setAttribute('aria-label','搜索配送任务');
  const showSection=(selector,key)=>{const target=list.querySelector(selector);if(!target){active('route');scrollToTop();const note=$('mobileCourierNotice');note.textContent=key==='processed'?'当前没有已处理记录':'当前没有未来预约';return}if(target.tagName==='DETAILS')target.open=true;active(key);target.scrollIntoView({behavior:'smooth',block:'start'})};
  const notice=el('p','mobile-courier-notice');notice.id='mobileCourierNotice';notice.setAttribute('role','status');filter.after(notice);
  tab('route','▤','待办路线',()=>{active('route');notice.textContent='';scrollToTop()});tab('processed','✓','已处理',()=>showSection('.courier-route-processed','processed'));tab('future','◷','未来预约',()=>showSection('.courier-future-pickups','future'));tab('search','⌕','搜索',()=>{active('search');scrollToTop();search.focus()});active('route');
  function enhance(){const cockpit=list.querySelector('.courier-route-cockpit');if(!cockpit||cockpit.dataset.mobileEnhanced)return;cockpit.dataset.mobileEnhanced='1';const areas=[...list.querySelectorAll('.courier-route-list [data-route-area]')];if(areas.length){const wrap=el('label','mobile-building-picker');wrap.append(el('span','','快速切换楼栋'));const select=el('select','input');select.setAttribute('aria-label','切换待办楼栋');for(const a of areas){const o=el('option','',a.closest('.courier-route-school').querySelector('summary').childNodes[0].textContent.trim()+' · '+a.closest('.courier-route-campus').querySelector('summary').childNodes[0].textContent.trim()+' · '+a.querySelector('summary').textContent.trim());o.value=a.dataset.routeArea;o.selected=a.classList.contains('active');select.append(o)}select.onchange=()=>{active('route');selectCourierPickupArea(select.value)};wrap.append(select);cockpit.after(wrap)}}
  new MutationObserver(enhance).observe(list,{childList:true,subtree:true});enhance();
 }
})();
