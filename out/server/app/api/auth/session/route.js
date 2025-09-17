"use strict";(()=>{var e={};e.id=603,e.ids=[603],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},1568:e=>{e.exports=require("zlib")},4856:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>h,patchFetch:()=>g,requestAsyncStorage:()=>m,routeModule:()=>p,serverHooks:()=>_,staticGenerationAsyncStorage:()=>c});var a={};r.r(a),r.d(a,{GET:()=>d});var s=r(9303),i=r(8716),o=r(670),n=r(1595);r(7258);var u=r(2859);async function l(e,t){if((0,u.P)(e,t,["GET"]))try{let r=e.headers.authorization;if(!r)return(0,u.LW)(t,"Access token required");let a=r.startsWith("Bearer ")?r.substring(7):r,{data:{user:s},error:i}=await n.OQ.auth.getUser(a);if(i||!s)return(0,u.LW)(t,"Invalid or expired session");let o=null;if(n.pR){let{data:e}=await n.pR.from(n.ji.USERS).select(`
          id,
          username,
          display_name,
          email,
          avatar_url,
          bio,
          role,
          created_at,
          updated_at,
          last_login_at
        `).eq("id",s.id).single();o=e}let l=null;if(n.pR){let{data:e}=await n.pR.from(n.ji.USER_PREFERENCES).select("*").eq("user_id",s.id).single();l=e}let d=null;if(n.pR){let{data:e}=await n.pR.from(n.ji.USER_STATS).select(`
          total_sessions,
          completed_sessions,
          total_minutes,
          completed_minutes,
          streak_days,
          longest_streak,
          completion_rate,
          average_session_length
        `).eq("user_id",s.id).single();d=e}let p={user:{id:s.id,email:s.email,username:o?.username,displayName:o?.display_name||s.user_metadata?.display_name,avatarUrl:o?.avatar_url||s.user_metadata?.avatar_url,bio:o?.bio,role:o?.role||"user",emailConfirmed:!!s.email_confirmed_at,createdAt:s.created_at,updatedAt:o?.updated_at,lastLoginAt:o?.last_login_at},preferences:l,stats:d,sessionValid:!0,message:"Session is valid"};return(0,u.Wr)(t,p,p.message)}catch(e){return console.error("Session validation error:",e),(0,u.y7)(t,"Session validation failed",500)}}let d=(0,u.bi)(l),p=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/auth/session/route",pathname:"/api/auth/session",filename:"route",bundlePath:"app/api/auth/session/route"},resolvedPagePath:"/home/devswha/workspace/pomodoro/app/api/auth/session/route.js",nextConfigOutput:"",userland:a}),{requestAsyncStorage:m,staticGenerationAsyncStorage:c,serverHooks:_}=p,h="/api/auth/session/route";function g(){return(0,o.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:c})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[948,766,482,258],()=>r(4856));module.exports=a})();