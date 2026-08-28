"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Marquee } from '@/components/ui/marquee';

const testimonials = [
  {
    name: 'Sarah Jenkins',
    username: '@sarah_j',
    body: 'Size Passport cut our returns by 22% in just the first month!',
    img: 'https://randomuser.me/api/portraits/women/32.jpg',
    country: '🇺🇸 USA',
  },
  {
    name: 'David Müller',
    username: '@davidm',
    body: 'The AI fit engine is incredibly accurate. Our customers love it.',
    img: 'https://randomuser.me/api/portraits/men/68.jpg',
    country: '🇩🇪 Germany',
  },
  {
    name: 'Mateo Rossi',
    username: '@matrossi',
    body: 'Integration with our Dawn theme was absolutely seamless.',
    img: 'https://randomuser.me/api/portraits/men/51.jpg',
    country: '🇮🇹 Italy',
  },
  {
    name: 'Maya Patel',
    username: '@mayap',
    body: 'The analytics dashboard gives us insights we never had before.',
    img: 'https://randomuser.me/api/portraits/women/53.jpg',
    country: '🇬🇧 UK',
  },
  {
    name: 'Noah Smith',
    username: '@noahs',
    body: 'A must-have app for any apparel store on Shopify.',
    img: 'https://randomuser.me/api/portraits/men/33.jpg',
    country: '🇨🇦 Canada',
  },
  {
    name: 'Emma Lee',
    username: '@emmalee',
    body: 'Customer confidence skyrocketed after installing this.',
    img: 'https://randomuser.me/api/portraits/women/45.jpg',
    country: '🇦🇺 Australia',
  },
];

function TestimonialCard({ img, name, username, body, country }: (typeof testimonials)[number]) {
  return (
    <Card className="w-64 glass-panel border border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5 mb-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-10 h-10 border border-white/40 dark:border-white/10 shadow-sm">
            <AvatarImage src={img} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <figcaption className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
              {name} <span className="text-xs opacity-70">{country}</span>
            </figcaption>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{username}</p>
          </div>
        </div>
        <blockquote className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">"{body}"</blockquote>
      </CardContent>
    </Card>
  );
}

export function Testimonials3D() {
  return (
    <div className="relative flex h-[500px] md:h-[600px] w-full items-center justify-center overflow-hidden gap-4 [perspective:800px] md:[perspective:1000px]">
      <div
        className="flex flex-row items-center gap-4 md:gap-6"
        style={{
          transform:
            'translateX(0px) translateY(0px) translateZ(0px) rotateX(15deg) rotateY(-10deg) rotateZ(5deg)',
        }}
      >
        {/* Vertical Marquee (downwards) */}
        <Marquee vertical pauseOnHover repeat={4} className="[--duration:50s]">
          {testimonials.slice(0, 3).map((review) => (
            <TestimonialCard key={review.username} {...review} />
          ))}
        </Marquee>
        
        {/* Vertical Marquee (upwards) */}
        <Marquee vertical pauseOnHover reverse repeat={4} className="[--duration:45s] hidden sm:flex">
          {testimonials.slice(3, 6).map((review) => (
            <TestimonialCard key={review.username} {...review} />
          ))}
        </Marquee>
        
        {/* Vertical Marquee (downwards) */}
        <Marquee vertical pauseOnHover repeat={4} className="[--duration:60s] hidden lg:flex">
          {[...testimonials].reverse().slice(0, 3).map((review) => (
            <TestimonialCard key={review.username} {...review} />
          ))}
        </Marquee>

      </div>
      
      {/* Gradient overlays for vertical marquee */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-background via-background/80 to-transparent z-10"></div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background via-background/80 to-transparent z-10"></div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background via-background/80 to-transparent z-10 hidden md:block"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background via-background/80 to-transparent z-10 hidden md:block"></div>
    </div>
  );
}
