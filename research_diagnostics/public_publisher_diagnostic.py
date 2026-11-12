#!/usr/bin/env python3
"""Read-only public publisher connectivity diagnostic. No credentials or scraping bypasses."""
import csv, json, os, re, time, urllib.request, urllib.error, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

SOURCES = {
 "Chicago": ["https://blockclubchicago.org/feed/", "https://news.wttw.com/rss.xml"],
 "Los Angeles": ["https://laist.com/rss", "https://la.eater.com/rss/index.xml", "https://www.latimes.com/rss2.0.xml"],
 "Manhattan": ["https://hellgatenyc.com/rss/", "https://ny.eater.com/rss/index.xml", "https://rss.nytimes.com/services/xml/rss/nyt/NYRegion.xml"],
 "Palm Springs": ["https://www.palmspringslife.com/feed/", "https://www.desertsun.com/rss/", "https://www.localsguide.com/feed/"],
}
class VisibleText(HTMLParser):
 def __init__(self): super().__init__(); self.parts=[]; self.skip=0
 def handle_starttag(self,tag,attrs):
  if tag in ("script","style","noscript"): self.skip+=1
 def handle_endtag(self,tag):
  if tag in ("script","style","noscript"): self.skip=max(0,self.skip-1)
 def handle_data(self,data):
  if not self.skip: self.parts.append(data)
def get(url, timeout=12):
 req=urllib.request.Request(url,headers={"User-Agent":"LocalByLocalResearchDiagnostics/1.0 (read-only; public content)","Accept":"application/rss+xml, application/atom+xml, text/html, */*"})
 start=time.monotonic()
 try:
  with urllib.request.urlopen(req,timeout=timeout) as r:
   data=r.read(1_500_000); return {"status":r.status,"final_url":r.url,"body":data,"seconds":round(time.monotonic()-start,2)}
 except urllib.error.HTTPError as e: return {"status":e.code,"error":str(e),"seconds":round(time.monotonic()-start,2)}
 except Exception as e: return {"status":None,"error":type(e).__name__+": "+str(e),"seconds":round(time.monotonic()-start,2)}
def links_from_feed(body):
 try: root=ET.fromstring(body)
 except ET.ParseError: return []
 links=[]
 for node in root.iter():
  tag=node.tag.rsplit("}",1)[-1].lower()
  if tag=="item":
   for child in node:
    if child.tag.rsplit("}",1)[-1].lower()=="link" and child.text: links.append(child.text.strip()); break
  if tag=="entry":
   for child in node:
    if child.tag.rsplit("}",1)[-1].lower()=="link" and child.attrib.get("href"): links.append(child.attrib["href"]); break
 return [u for u in links if u.startswith("http")]
def main():
 limit=int(os.environ.get("ARTICLES_PER_FEED","3")); out=Path("diagnostic_results");out.mkdir(exist_ok=True)
 rows=[]; article_rows=[]
 for city,feeds in SOURCES.items():
  for url in feeds:
   result=get(url); links=links_from_feed(result.get("body",b""))
   rows.append({"city":city,"feed":url,"status":result["status"],"article_links":len(links),"seconds":result["seconds"],"error":result.get("error","")})
   print(city,url,result["status"],"links",len(links),flush=True)
   for article in links[:limit]:
    r=get(article); body=r.get("body",b""); parser=VisibleText()
    try: parser.feed(body.decode("utf-8","replace"))
    except Exception: pass
    words=len(re.findall(r"\b\w+\b"," ".join(parser.parts)))
    article_rows.append({"city":city,"feed":url,"url":article,"status":r["status"],"words":words,"readable":bool(r["status"]==200 and words>=120),"seconds":r["seconds"],"error":r.get("error","")})
 for name,data,fields in [("feeds.csv",rows,["city","feed","status","article_links","seconds","error"]),("articles.csv",article_rows,["city","feed","url","status","words","readable","seconds","error"])]:
  with (out/name).open("w",newline="",encoding="utf-8") as f:
   writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(data)
 summary={"created_utc":datetime.now(timezone.utc).isoformat(),"feeds_tested":len(rows),"feeds_http_200":sum(r["status"]==200 for r in rows),"articles_tested":len(article_rows),"readable_articles":sum(r["readable"] for r in article_rows),"note":"Connectivity and extraction only; no venue matching or evidence approval."}
 (out/"summary.json").write_text(json.dumps(summary,indent=2),encoding="utf-8");print(json.dumps(summary,indent=2))
if __name__=="__main__":main()
