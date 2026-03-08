import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, ShoppingBag, Clock } from "lucide-react";
import { getProfile } from "@/lib/userStore";

interface Item {
  id: string; name: string; description: string;
  pointsCost: number; category: string; brand: string; emoji: string; comingSoon: boolean;
}

const items: Item[] = [
  { id:"1",  name:"Amazon Gift Card ₹500",    description:"Shop anything on Amazon India",       pointsCost:5000,  category:"gift-card",    brand:"Amazon",    emoji:"🛒",  comingSoon:false },
  { id:"2",  name:"Amazon Gift Card ₹1000",   description:"Shop anything on Amazon India",       pointsCost:10000, category:"gift-card",    brand:"Amazon",    emoji:"🛒",  comingSoon:false },
  { id:"3",  name:"Flipkart Gift Card ₹500",  description:"Shop on Flipkart",                    pointsCost:5000,  category:"gift-card",    brand:"Flipkart",  emoji:"🛍️", comingSoon:true  },
  { id:"4",  name:"Swiggy Credits ₹300",      description:"Order your favourite food",           pointsCost:3000,  category:"food",         brand:"Swiggy",    emoji:"🍔",  comingSoon:true  },
  { id:"5",  name:"Zomato Credits ₹300",      description:"Order your favourite food",           pointsCost:3000,  category:"food",         brand:"Zomato",    emoji:"🍕",  comingSoon:true  },
  { id:"6",  name:"Netflix 1 Month",          description:"Stream movies and shows",             pointsCost:6490,  category:"entertainment",brand:"Netflix",   emoji:"🎬",  comingSoon:true  },
  { id:"7",  name:"Spotify Premium 1 Month",  description:"Ad-free music streaming",             pointsCost:1190,  category:"entertainment",brand:"Spotify",   emoji:"🎵",  comingSoon:true  },
  { id:"8",  name:"Myntra Gift Card ₹500",    description:"Fashion & lifestyle",                 pointsCost:5000,  category:"gift-card",    brand:"Myntra",    emoji:"👗",  comingSoon:true  },
  { id:"9",  name:"PhonePe Cashback ₹200",    description:"Direct to PhonePe wallet",            pointsCost:2000,  category:"cashback",     brand:"PhonePe",   emoji:"💸",  comingSoon:true  },
  { id:"10", name:"Paytm Cash ₹500",          description:"Direct to Paytm wallet",              pointsCost:5000,  category:"cashback",     brand:"Paytm",     emoji:"💰",  comingSoon:true  },
  { id:"11", name:"Bigbasket Voucher ₹500",   description:"Groceries delivered home",            pointsCost:5000,  category:"food",         brand:"Bigbasket", emoji:"🥦",  comingSoon:true  },
  { id:"12", name:"Nykaa Gift Card ₹500",     description:"Beauty & personal care",              pointsCost:5000,  category:"gift-card",    brand:"Nykaa",     emoji:"💄",  comingSoon:true  },
];

const categories = ["all","gift-card","food","entertainment","cashback"];
const categoryLabels: Record<string,string> = {
  all:"All Rewards","gift-card":"🎁 Gift Cards",food:"🍔 Food",entertainment:"🎬 Entertainment",cashback:"💸 Cashback",
};

export default function Marketplace() {
  const [points, setPoints] = useState(getProfile().points);
  const [activeCategory, setActiveCategory] = useState("all");
  const filtered = activeCategory === "all" ? items : items.filter(i => i.category === activeCategory);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Chakri Marketplace</h1>
          <Badge className="ml-2 bg-amber-100 text-amber-700 border-amber-200">Beta</Badge>
        </div>
        <p className="text-muted-foreground">Redeem your Chakri Coins for rewards — more options coming soon!</p>
      </div>

      {/* Balance */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
              <Award className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="text-3xl font-bold">{points.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Chakri Coins</p>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground hidden md:block">
            <p>Refer someone → earn <span className="font-semibold text-primary">+coins</span></p>
            <p>Successful hire → earn <span className="font-semibold text-primary">+2000 coins</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map(cat => (
          <Button key={cat} size="sm" variant={activeCategory === cat ? "default" : "outline"} onClick={() => setActiveCategory(cat)}>
            {categoryLabels[cat]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(item => {
          const canAfford = points >= item.pointsCost && !item.comingSoon;
          return (
            <Card key={item.id} className={"flex flex-col transition-all hover:shadow-md relative " + (item.comingSoon ? "opacity-75" : "")}>
              {item.comingSoon && (
                <div className="absolute inset-0 rounded-xl flex items-center justify-center z-10 bg-background/60 backdrop-blur-[1px]">
                  <div className="text-center px-4">
                    <Clock className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs font-semibold">Coming Soon</Badge>
                  </div>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{item.emoji}</span>
                  <Badge variant="secondary" className="text-xs">{item.brand}</Badge>
                </div>
                <CardTitle className="text-base leading-snug mt-2">{item.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col flex-1 justify-end gap-3">
                <div className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold text-lg">{item.pointsCost.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">coins</span>
                </div>
                <Button size="sm" className="w-full" disabled={!canAfford} variant={canAfford ? "default" : "outline"}>
                  {item.comingSoon ? "Coming Soon" : canAfford ? "Redeem" : `Need ${(item.pointsCost - points).toLocaleString()} more`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
