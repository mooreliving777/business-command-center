/* Local-only filtering. No analytics, cookies, storage, fetch or third-party scripts. */
(() => {
  const rows=Array.from(document.querySelectorAll('.resource-row'));
  const search=document.getElementById('resource-search');
  const category=document.getElementById('resource-group');
  const picks=document.getElementById('resource-recommended');
  const count=document.getElementById('resource-count');
  const more=document.getElementById('resource-more');
  const empty=document.getElementById('resource-empty');
  const PAGE_SIZE=8;
  let limit=PAGE_SIZE;
  function render(){
    const q=search.value.toLocaleLowerCase().trim();
    const group=category.value;
    const matches=rows.filter(row=>
      (!picks.checked || row.dataset.recommended==='true') &&
      (!group || row.dataset.group===group) &&
      (!q || row.dataset.search.includes(q))
    );
    let displayed=0;
    for(const row of rows){
      const idx=matches.indexOf(row);
      const visible=idx!==-1 && idx<limit;
      row.hidden=!visible;
      if(visible)displayed++;
    }
    empty.hidden=matches.length!==0;
    more.hidden=displayed>=matches.length;
    more.textContent='SHOW '+Math.min(PAGE_SIZE,matches.length-displayed)+' MORE RESOURCES ('+(matches.length-displayed)+' REMAINING) ↓';
    count.textContent=displayed+' DISPLAYED · '+matches.length+' MATCHING · '+rows.length+' TOTAL';
  }
  function reset(){limit=PAGE_SIZE;render();}
  search.addEventListener('input',()=>{
    if(search.value.trim())picks.checked=false;
    reset();
  });
  category.addEventListener('change',reset);
  picks.addEventListener('change',reset);
  more.addEventListener('click',()=>{limit+=PAGE_SIZE;render();});
  render();
})();