#!/usr/bin/env python3
"""Read-only audit of repository city JSON. Never approves evidence or changes venue data."""
import csv, json, os, re, sys, urllib.parse, urllib.request, urllib.error
from pathlib import Path
from collections import Counter

ROOT=Path(__file__).resolve().parents[1]
OUT=Path("diagnostic_results"); OUT.mkdir(exist_ok=True)
CITY_FILES={"Chicago":"chicago.json","Los Angeles":"los_angeles.json","Manhattan/NYC":"new_york.json","Palm Springs":"palm_springs.json"}
SOCIAL=("facebook.com","instagram.com","fb.com","m.facebook.com")
URL_KEYS=("Website","Website_URL","website","website_url","URL","url","Facebook_URL","Instagram_URL","Facebook","Instagram","Social_Media")
def host(url):
 try: return (urllib.parse.urlsplit(url).hostname or "").lower()
 except Exception: return ""
def classify(url):
 h=host(url)
 if any(h==s or h.endswith("."+s) for s in SOCIAL): return "social"
 return "website" if h else "invalid"
def probe(url,timeout):
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; LocalByLocalDiagnostic/1.0)"})
 try:
  with urllib.request.urlopen(req,timeout=timeout) as r: return str(r.status),""
 except urllib.error.HTTPError as e: return str(e.code),str(e.reason)
 except Exception as e: return "ERROR",type(e).__name__+": "+str(e)[:160]
def load_city(path):
 data=json.loads(path.read_text(encoding="utf-8-sig"))
 if isinstance(data,list): return data
 if isinstance(data,dict):
  for key in ("venues","places","items","data","businesses"):
   if isinstance(data.get(key),list): return data[key]
 raise ValueError("Unknown city JSON structure")
def main():
 limit=int(os.getenv("WEBSITES_PER_CITY","25")); live=os.getenv("LIVE_WEBSITE_CHECK","false").lower()=="true"
 records=[];summary=[]; websites=[]
 for city,filename in CITY_FILES.items():
  path=ROOT/"cities"/filename
  if not path.exists(): summary.append({"city":city,"error":"missing JSON"});continue
  try: venues=load_city(path)
  except Exception as e: summary.append({"city":city,"error":str(e)});continue
  duplicates=Counter(); synthetic=0; social_only=0; no_presence=0; names_missing=0
  for i,v in enumerate(venues):
   if not isinstance(v,dict):continue
   name=str(v.get("Name") or v.get("name") or "").strip()
   if not name: names_missing+=1
   if name: duplicates[name.casefold()]+=1
   placeholder=bool(re.search(r"\bVenue\s+\d+\b",name,re.I))
   if placeholder: synthetic+=1
   urls=[]
   for k in URL_KEYS:
    val=v.get(k)
    if isinstance(val,str) and val.startswith(("https://","http://")): urls.append((k,val))
   ws=[(k,u) for k,u in urls if classify(u)=="website"]
   ss=[(k,u) for k,u in urls if classify(u)=="social"]
   if ss and not ws: social_only+=1
   if not ss and not ws: no_presence+=1
   records.append({"city":city,"row":i+1,"id":v.get("ID") or v.get("id") or "","name":name,"placeholder_name":placeholder,"website_count":len(ws),"social_count":len(ss),"website_urls":" | ".join(u for _,u in ws),"social_urls":" | ".join(u for _,u in ss),"review_required":bool(placeholder or not name)})
   if live and ws and len([x for x in websites if x["city"]==city])<limit:
    url=ws[0][1];status,error=probe(url,10)
    websites.append({"city":city,"name":name,"url":url,"status":status,"error":error})
  summary.append({"city":city,"venue_count":len(venues),"placeholder_names":synthetic,"missing_names":names_missing,"duplicate_name_groups":sum(n>1 for n in duplicates.values()),"social_only":social_only,"no_website_or_social_url":no_presence,"websites_tested":sum(x["city"]==city for x in websites)})
 def csvout(name,rows,fields):
  with (OUT/name).open("w",newline="",encoding="utf-8") as f:
   w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
 csvout("venue_presence_audit.csv",records,["city","row","id","name","placeholder_name","website_count","social_count","website_urls","social_urls","review_required"])
 csvout("website_checks.csv",websites,["city","name","url","status","error"])
 (OUT/"venue_summary.json").write_text(json.dumps({"cities":summary,"scope":"Published PWA JSON, NOT 10,526 MAX workbook records","limitations":"URL presence does not verify identity; social pages not fetched; placeholder records never count as validated venues; no scores changed."},indent=2),encoding="utf-8")
 print(json.dumps(summary,indent=2))
if __name__=="__main__":main()
