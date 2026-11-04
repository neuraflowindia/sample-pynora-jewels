/* Pynora catalogue: the shop, its collections, every piece (words, pictures, reviews) and the shared texts.
   A classic script that sets one global object, so pages can read it from disk and online alike.
   Picture files: images.base + <product id>/ + <file>-<width> + images.ext. Prices are whole rupees, taxes included. */
window.PYNORA_CATALOGUE = {
  "version": "2026-11-04",
  "shop": {
    "name": "Pynora Jewels & Decor",
    "tagline": "For those with exceptional taste",
    "descriptor": "Premium imitation & designer jewellery, handcrafted in Karnal.",
    "whatsapp": "919991263699",
    "phone": "+91 99912 63699",
    "instagram": "pynorajewels",
    "shipping": "Free shipping across India · Shipping worldwide",
    "store": {
      "line": "Kalandri Gate, Old GT Road",
      "city": "Karnal",
      "state": "Haryana",
      "pin": "132001",
      "hours": "Open every day, 11\u00a0am – 8\u00a0pm",
      "mapsQuery": "Pynora Jewels & Decor, Kalandri Gate, Old GT Road, Karnal"
    }
  },
  "images": {
    "base": "assets/img/products/",
    "ext": ".webp"
  },
  "blocks": {
    "madeByHand": "Each Pynora piece is set by hand by our karigars. Tiny differences in stones, colour and finish are the mark of handwork, never a flaw.",
    "madeByHandHindi": "हाथों का हुनर",
    "care": {
      "jewellery": "Keep it away from water, perfume and lotion. Put it on last and take it off first. Store it in its pouch, away from other pieces, and wipe it with a soft, dry cloth.",
      "bag": "Store it filled with tissue in its dust bag, away from sunlight. Keep the stones from rubbing against other bags, and keep it dry.",
      "decor": "Dust it with a soft, dry brush. No polish or liquids on the stones, and keep it away from damp."
    },
    "delivery": {
      "ready": "Leaves our Karnal studio within 48\u00a0hours and arrives in 3–6\u00a0working days across India. Shipping is free.",
      "mto": "Made for you in {time}. We send you a photo on WhatsApp before it leaves, and it arrives in 3–6\u00a0working days after that. Shipping is free.",
      "worldwide": "We ship worldwide; ask us on WhatsApp for rates and times."
    },
    "payment": {
      "ready": "Pay online, or cash on delivery.",
      "mto": "50% advance online, the rest on delivery."
    },
    "exchange": {
      "ready": "Unworn pieces can be exchanged within 7\u00a0days of delivery, in their box.",
      "mto": "Made-to-order pieces are made for you and cannot be exchanged, but we fix any making fault you tell us about within 48\u00a0hours of delivery."
    },
    "packaging": "Every piece arrives in our crimson Pynora gift box with a soft pouch and a care card. A handwritten gift note is free.",
    "mtoSteps": [
      "You order",
      "We make it by hand in our studio",
      "We send you a photo, then pack and ship"
    ],
    "status": {
      "ready": {
        "short": "Ships in 48\u00a0hrs",
        "long": "Ready to ship · dispatched in 48\u00a0hrs"
      },
      "mto": {
        "short": "Made to order",
        "long": "Made to order · ready in {time}"
      }
    },
    "promises": {
      "ready": [
        [
          "truck",
          "Free shipping"
        ],
        [
          "banknote",
          "Cash on delivery"
        ],
        [
          "refresh-ccw",
          "7-day exchange"
        ],
        [
          "gift",
          "Gift-boxed"
        ]
      ],
      "mto": [
        [
          "truck",
          "Free shipping"
        ],
        [
          "banknote",
          "50% advance"
        ],
        [
          "camera",
          "Photo before dispatch"
        ],
        [
          "gift",
          "Gift-boxed"
        ]
      ]
    },
    "stockNote": "Only {n} left",
    "whatsappMessage": "Hi Pynora, I’d like to know more about the {name}{colour} – {link}",
    "faq": [
      [
        "Is Pynora jewellery real gold?",
        "No. It is designer jewellery in plated brass, set by hand, made to be worn often and loved long."
      ],
      [
        "Do you rent pieces?",
        "No. Every Pynora piece is made to be yours."
      ],
      [
        "Can I see a piece on a video call?",
        "Yes. Message us on WhatsApp and we will show you any piece from every side."
      ],
      [
        "Can you make a piece in another colour?",
        "Often, yes. Ask us on WhatsApp."
      ]
    ],
    "ourStory": {
      "title": "Our story",
      "paragraphs": [
        "Pynora Jewels & Decor is Divi Chhabra’s house of designer jewellery, home décor and gifts, for those with exceptional taste.",
        "We opened our store at Kalandri Gate, Old GT Road, Karnal, on 21 August 2026. From Karnal, we ship worldwide.",
        "Every Pynora piece has a story. Our collections include Vantara, animals in jewels crafted exclusively on order, and High Jewels.",
        "In Decode the piece, our own series, we look at a statement piece detail by detail."
      ],
      "quote": "The vision was always bigger than the moment.",
      "quoteBy": "Divi Chhabra, Founder"
    }
  },
  "collections": [
    {
      "id": "all",
      "title": "Shop all",
      "hindi": null,
      "intro": "Jewellery, bags and décor, set and finished by hand. Every piece has a story.",
      "productIds": [
        "shahi-panna-polki-bridal-set",
        "anaar-twin-leaf-collar-set",
        "hariyali-kundan-hasli",
        "lehar-spiral-necklace-set",
        "mehtab-pearl-chandbalis",
        "gulmohar-kundan-jhumkas",
        "vantara-bhanwra-bee-studs",
        "sheesh-mahal-polki-bag",
        "mehfil-jadau-potli",
        "vantara-hiran-nano-bag",
        "vantara-gaj-sindoor-box",
        "shikhar-temple-sindoor-box"
      ],
      "portrait": {
        "home": "opening-shahi-panna-dressing-table",
        "widths": [
          760,
          1140,
          1520
        ],
        "ratio": 1.044,
        "focal": "60% 50%",
        "alt": "The Shahi Panna polki-style bridal set on a polished dark dressing table in late jharokha light."
      },
      "chip": {
        "mode": "top-right",
        "product": "shahi-panna-polki-bridal-set",
        "icon": "crown",
        "line": "Founder’s pick"
      },
      "note": {
        "title": "Made in our Karnal studio",
        "text": "Every piece is set, polished and checked by hand at Kalandri Gate, then packed in our crimson box."
      },
      "quote": {
        "product": "lehar-spiral-necklace-set",
        "name": "Devika P."
      },
      "reviewsOf": "",
      "ask": null,
      "medal": {
        "product": "vantara-gaj-sindoor-box",
        "n": 1
      }
    },
    {
      "id": "necklaces-sets",
      "title": "Necklaces & sets",
      "hindi": "गले की शान",
      "intro": "A polki-style bridal set, a kundan-style hasli, a ruby-red collar and one quiet spiral, each finished by hand.",
      "productIds": [
        "shahi-panna-polki-bridal-set",
        "anaar-twin-leaf-collar-set",
        "hariyali-kundan-hasli",
        "lehar-spiral-necklace-set"
      ],
      "portrait": {
        "product": "hariyali-kundan-hasli",
        "n": 5
      },
      "chip": {
        "mode": "bottom-left",
        "product": "hariyali-kundan-hasli",
        "icon": "sparkle"
      },
      "note": {
        "title": "Measured before it reaches you",
        "text": "Each necklace lists its length and weight, so you know how it will sit, from a close collar to a hasli."
      },
      "quote": {
        "product": "hariyali-kundan-hasli",
        "name": "Simran K."
      },
      "reviewsOf": "of our necklaces and sets",
      "ask": "necklaces and sets",
      "medal": {
        "product": "hariyali-kundan-hasli",
        "n": 1
      }
    },
    {
      "id": "earrings",
      "title": "Earrings",
      "hindi": "कानों में चाँदनी",
      "intro": "Chandbalis, jhumkas and a little bee, light enough to wear all evening.",
      "productIds": [
        "mehtab-pearl-chandbalis",
        "gulmohar-kundan-jhumkas",
        "vantara-bhanwra-bee-studs"
      ],
      "portrait": {
        "product": "mehtab-pearl-chandbalis",
        "n": 4,
        "focal": "50% 50%"
      },
      "chip": {
        "mode": "bottom-left",
        "product": "mehtab-pearl-chandbalis",
        "icon": "sparkle"
      },
      "note": {
        "title": "Light enough for a long evening",
        "text": "From a 7\u00a0g bee to a 25\u00a0g chandbali, every earring is weighed, so you know how it will feel by midnight."
      },
      "quote": {
        "product": "mehtab-pearl-chandbalis",
        "name": "Aditi V."
      },
      "reviewsOf": "of our earrings",
      "ask": "earrings",
      "medal": {
        "product": "mehtab-pearl-chandbalis",
        "n": 1
      }
    },
    {
      "id": "bags",
      "title": "Bags",
      "hindi": "हाथों में थोड़ी चमक",
      "intro": "A polki-style half-moon, a jadau potli and a tiny box bag: the last jewel in your hand.",
      "productIds": [
        "sheesh-mahal-polki-bag",
        "mehfil-jadau-potli",
        "vantara-hiran-nano-bag"
      ],
      "portrait": {
        "product": "sheesh-mahal-polki-bag",
        "n": 4
      },
      "chip": {
        "mode": "pictured",
        "product": "sheesh-mahal-polki-bag",
        "icon": "crown",
        "line": "Only 2 left"
      },
      "note": {
        "title": "Room for what matters",
        "text": "Each bag says what it holds: the Sheesh Mahal takes a phone up to 6.1\u00a0in; the nano bag, a lipstick and cards."
      },
      "quote": {
        "product": "sheesh-mahal-polki-bag",
        "name": "Sakshi P."
      },
      "reviewsOf": "of our bags",
      "ask": "bags",
      "medal": {
        "product": "sheesh-mahal-polki-bag",
        "n": 1
      }
    },
    {
      "id": "decor",
      "title": "Décor",
      "hindi": "घर की रौनक",
      "intro": "Gold-plated sindoor boxes for the wedding day, and every day after it.",
      "productIds": [
        "vantara-gaj-sindoor-box",
        "shikhar-temple-sindoor-box"
      ],
      "portrait": {
        "product": "shikhar-temple-sindoor-box",
        "n": 4
      },
      "chip": {
        "mode": "pictured",
        "product": "shikhar-temple-sindoor-box",
        "icon": "sparkle"
      },
      "note": {
        "title": "Heavy, gilded and hinged",
        "text": "Both boxes are gold-plated brass with hinged lids, made to sit proudly on a dressing table for years."
      },
      "quote": {
        "product": "vantara-gaj-sindoor-box",
        "name": "Prachi S."
      },
      "reviewsOf": "of our décor",
      "ask": "décor",
      "medal": {
        "product": "shikhar-temple-sindoor-box",
        "n": 1
      }
    },
    {
      "id": "vantara",
      "title": "Vantara",
      "hindi": "वनतारा, हाथों से गढ़ा",
      "intro": "Our in-house collection of animals in jewels: a bumblebee, a pair of deer and an elephant, each made only when you order it.",
      "productIds": [
        "vantara-bhanwra-bee-studs",
        "vantara-hiran-nano-bag",
        "vantara-gaj-sindoor-box"
      ],
      "portrait": {
        "product": "vantara-hiran-nano-bag",
        "n": 7,
        "focal": "50% 62%"
      },
      "chip": {
        "mode": "pictured",
        "product": "vantara-hiran-nano-bag",
        "icon": "spool",
        "line": "Made to order",
        "colour": "Ivory"
      },
      "note": {
        "title": "Made only when you order",
        "text": "Each Vantara piece is made for you in 10\u00a0days to 3\u00a0weeks, and we send you a photo before it leaves."
      },
      "quote": {
        "product": "vantara-hiran-nano-bag",
        "name": "Anushka B."
      },
      "reviewsOf": "of Vantara pieces",
      "ask": "Vantara collection",
      "medal": {
        "product": "vantara-hiran-nano-bag",
        "n": 1
      }
    },
    {
      "id": "bridal-edit",
      "title": "The Bridal Edit",
      "hindi": "दुल्हन का शृंगार",
      "intro": "A polki-style set, a kundan-style hasli, chandbalis, a jadau potli and a box for the sindoor.",
      "productIds": [
        "shahi-panna-polki-bridal-set",
        "hariyali-kundan-hasli",
        "mehtab-pearl-chandbalis",
        "mehfil-jadau-potli",
        "shikhar-temple-sindoor-box"
      ],
      "portrait": {
        "product": "shahi-panna-polki-bridal-set",
        "n": 4,
        "focal": "50% 30%"
      },
      "chip": {
        "mode": "bottom-left",
        "product": "shahi-panna-polki-bridal-set",
        "icon": "crown",
        "line": "Founder’s pick"
      },
      "note": {
        "title": "Wear one, or all five",
        "text": "The set, the hasli, the chandbalis, the potli and the sindoor box are chosen to sit together on the day."
      },
      "quote": {
        "product": "shahi-panna-polki-bridal-set",
        "name": "Aanya M."
      },
      "reviewsOf": "of the Bridal Edit",
      "ask": "Bridal Edit",
      "medal": {
        "product": "shahi-panna-polki-bridal-set",
        "n": 1
      }
    },
    {
      "id": "gifting",
      "title": "Gifting",
      "hindi": "दिल से, आपके लिए",
      "intro": "Every piece arrives in our crimson gift box, with a handwritten note if you would like one.",
      "productIds": [
        "vantara-bhanwra-bee-studs",
        "gulmohar-kundan-jhumkas",
        "vantara-hiran-nano-bag",
        "mehtab-pearl-chandbalis",
        "lehar-spiral-necklace-set",
        "vantara-gaj-sindoor-box",
        "shikhar-temple-sindoor-box"
      ],
      "portrait": {
        "home": "gift-crimson-box-open",
        "widths": [
          560,
          840,
          1100
        ],
        "ratio": 0.8,
        "focal": "50% 50%",
        "alt": "Our crimson Pynora gift box, the lid lifted to show a satin insert, a note card and a velvet pouch."
      },
      "chip": {
        "mode": "bottom-left",
        "text": "Our crimson gift box",
        "href": "#care/shipping",
        "icon": "gift",
        "line": "Free with every piece"
      },
      "note": {
        "title": "Wrapped before it reaches you",
        "text": "Every piece arrives in our crimson box with a soft pouch and a care card. A handwritten note is free."
      },
      "quote": {
        "product": "vantara-bhanwra-bee-studs",
        "name": "Ananya T."
      },
      "reviewsOf": "of our gifts",
      "ask": "gifting edit",
      "medal": {
        "product": "vantara-bhanwra-bee-studs",
        "n": 1
      }
    },
    {
      "id": "new",
      "title": "New pieces",
      "hindi": "अभी-अभी आए",
      "intro": "New in the studio this festive season.",
      "productIds": [
        "anaar-twin-leaf-collar-set",
        "lehar-spiral-necklace-set",
        "gulmohar-kundan-jhumkas",
        "mehfil-jadau-potli"
      ],
      "portrait": {
        "product": "mehfil-jadau-potli",
        "n": 4
      },
      "chip": {
        "mode": "bottom-left",
        "product": "mehfil-jadau-potli",
        "icon": "sparkle",
        "line": "New"
      },
      "note": {
        "title": "Fresh from the workbench",
        "text": "Four pieces finished this festive season, and every one of them leaves Karnal within 48\u00a0hours."
      },
      "quote": {
        "product": "gulmohar-kundan-jhumkas",
        "name": "Rhea N."
      },
      "reviewsOf": "of our new pieces",
      "ask": "new pieces",
      "medal": {
        "product": "lehar-spiral-necklace-set",
        "n": 1
      }
    },
    {
      "id": "ready-to-ship",
      "title": "Ready to ship",
      "hindi": null,
      "intro": "Leaves our Karnal studio within 48\u00a0hours.",
      "productIds": [
        "anaar-twin-leaf-collar-set",
        "lehar-spiral-necklace-set",
        "mehtab-pearl-chandbalis",
        "gulmohar-kundan-jhumkas",
        "sheesh-mahal-polki-bag",
        "mehfil-jadau-potli",
        "shikhar-temple-sindoor-box"
      ],
      "portrait": {
        "home": "store-sage-niche",
        "widths": [
          400,
          760,
          1100
        ],
        "ratio": 0.8,
        "focal": "50% 40%",
        "alt": "A sage arched niche in our Karnal store, lit warm from within, with a necklace on a crimson stand."
      },
      "chip": {
        "mode": "bottom-left",
        "text": "Our store at Kalandri Gate",
        "short": "Our store in Karnal",
        "href": "index.html#visit",
        "icon": "pin",
        "line": "Visit us in Karnal"
      },
      "note": {
        "title": "Packed within 48 hours",
        "text": "Order today and it leaves our studio within 48\u00a0hours, arriving in 3–6\u00a0working days. Shipping is free."
      },
      "quote": {
        "product": "lehar-spiral-necklace-set",
        "name": "Mehak S."
      },
      "reviewsOf": "of pieces that ship in 48\u00a0hrs",
      "ask": "ready-to-ship pieces",
      "medal": {
        "product": "anaar-twin-leaf-collar-set",
        "n": 1
      }
    }
  ],
  "products": [
    {
      "id": "shahi-panna-polki-bridal-set",
      "name": "Shahi Panna Polki Bridal Set",
      "shortName": "Shahi Panna",
      "meaning": "royal emerald-green",
      "category": "necklaces-sets",
      "collections": [
        "necklaces-sets",
        "bridal-edit"
      ],
      "occasions": [
        "bridal",
        "festive"
      ],
      "tones": [
        "green",
        "pearl",
        "gold"
      ],
      "price": 22400,
      "availability": {
        "type": "made-to-order",
        "min": 2,
        "max": 3,
        "unit": "weeks",
        "time": "2–3\u00a0weeks",
        "timeShort": "2–3\u00a0wks"
      },
      "tag": "founders-pick",
      "stockLimit": null,
      "addedOn": "2026-08-21",
      "caption": "Green halos, pearls",
      "hook": "Polki-style stones and emerald-green ovals in sparkling halos, over a fringe of pearls.",
      "story": "Made for the day you will look back on. Each polki-style stone is pressed into its setting by hand, and every emerald-green stone sits in a halo of tiny sparkling stones, over a fringe of shell pearls that moves when you turn. The earrings and maang tikka are made to match.",
      "wearLabel": "Wear it with",
      "wearWith": "A red or wine lehenga, hair in a low bun so the tikka and earrings show.",
      "inTheSet": [
        "Necklace",
        "Pair of earrings",
        "Maang tikka"
      ],
      "details": [
        [
          "Finish",
          "Two-tone: antique gold-tone plating with oxidised settings, on brass"
        ],
        [
          "Stones",
          "Polki-style uncut glass, emerald-green glass, cubic zirconia halos, shell pearls"
        ],
        [
          "Closure",
          "Adjustable silk dori"
        ],
        [
          "Size",
          "Necklace 34\u00a0cm (13.4\u00a0in) plus dori; earrings 7.5\u00a0cm (3\u00a0in); tikka 12\u00a0cm (4.7\u00a0in) with its chain"
        ],
        [
          "Weight",
          "185–200\u00a0g the set"
        ]
      ],
      "code": "PJ-NS-0412",
      "specs": [
        [
          "Stone setting",
          "Polki-style stones hand-pressed into closed, foil-backed settings; cubic zirconia halos"
        ],
        [
          "Stones",
          "Polki-style uncut glass, emerald-green glass ovals, cubic zirconia, shell pearls"
        ],
        [
          "Finish",
          "Two-tone: antique gold-tone plating with oxidised settings"
        ],
        [
          "Base",
          "Brass"
        ],
        [
          "Drop",
          "A fringe of shell pearls on the necklace, earrings and tikka"
        ],
        [
          "Dori",
          "Yes, an adjustable silk dori"
        ],
        [
          "Size",
          "Necklace 34\u00a0cm (13.4\u00a0in) plus dori, 6\u00a0cm (2.4\u00a0in) deep at the front; earrings 7.5\u00a0cm (3\u00a0in) long, 4\u00a0cm (1.6\u00a0in) wide; tikka 12\u00a0cm (4.7\u00a0in) with its chain"
        ],
        [
          "Weight",
          "185–200\u00a0g the set: necklace 125–132\u00a0g, earrings 40–44\u00a0g the pair, tikka 20–24\u00a0g"
        ],
        [
          "Closure",
          "Necklace on its dori; push-back earrings; tikka on a hair hook"
        ],
        [
          "Colour",
          "Antique gold-tone with emerald-green and pearl white"
        ]
      ],
      "care": "jewellery",
      "images": [
        {
          "n": 1,
          "file": "shahi-panna-polki-bridal-set-01-still-life",
          "kind": "still-life",
          "role": "card",
          "colour": null,
          "widths": [
            160,
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 45%",
          "alt": "Polki-style choker with emerald-green stones in sparkling halos, with its earrings and maang tikka, laid out."
        },
        {
          "n": 2,
          "file": "shahi-panna-polki-bridal-set-02-on-model",
          "kind": "on-model",
          "role": "hover",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "45% 50%",
          "alt": "Worn with a red silk slip: the choker and its matching earrings."
        },
        {
          "n": 3,
          "file": "shahi-panna-polki-bridal-set-03-on-model",
          "kind": "on-model",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "A closer view of the pearl fringe resting at the collarbone."
        },
        {
          "n": 4,
          "file": "shahi-panna-polki-bridal-set-04-on-model",
          "kind": "on-model",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Worn with a blush saree, the maang tikka in place."
        },
        {
          "n": 5,
          "file": "shahi-panna-polki-bridal-set-05-on-model",
          "kind": "on-model",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "The choker from the front, on a red silk slip."
        }
      ],
      "colours": [],
      "completeTheLook": [
        "mehfil-jadau-potli",
        "shikhar-temple-sindoor-box"
      ],
      "related": [
        "hariyali-kundan-hasli",
        "anaar-twin-leaf-collar-set",
        "mehtab-pearl-chandbalis"
      ],
      "reviews": {
        "average": 4.8,
        "count": 5,
        "items": [
          {
            "name": "Ritika S.",
            "city": "Karnal",
            "date": "2026-09-18",
            "rating": 5,
            "title": "Worth every day of the wait",
            "text": "Ordered it for my roka, and it arrived the day after they sent the promised photo. The green stones sit in tiny sparkly halos and the pearls move beautifully. Everyone asked where it was from.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Harleen G.",
            "city": "Chandigarh",
            "date": "2026-10-03",
            "rating": 5,
            "title": null,
            "text": "I was nervous ordering a bridal set online, so I asked for a video call first. Divi showed me the set from every side. It looks even richer in person and the tikka matches perfectly.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Nikita B.",
            "city": "Panipat",
            "date": "2026-10-14",
            "rating": 4,
            "title": "Halos that catch the light",
            "text": "Stunning finish and the halos really catch the light. The necklace is weighty for a full evening, but the dori makes it easy to adjust. I would still buy it again.",
            "verified": true,
            "reply": "Thank you, Nikita. A softer silk dori helps on long evenings; message us and we will send one across."
          },
          {
            "name": "Aanya M.",
            "city": "Gurugram",
            "date": "2026-10-21",
            "rating": 5,
            "title": null,
            "text": "Wore it with a wine lehenga for my sister’s wedding. The two-tone finish looks properly antique, not shiny. It came in the red Pynora box with a handwritten note.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Kavya N.",
            "city": "London",
            "date": "2026-10-31",
            "rating": 5,
            "title": "Shipped to London safely",
            "text": "Beautifully packed and on time for a wedding here. The team kept me updated on WhatsApp the whole way, with a photo before it left Karnal.",
            "verified": true,
            "reply": null
          }
        ]
      }
    },
    {
      "id": "anaar-twin-leaf-collar-set",
      "name": "Anaar Twin Leaf Collar Set",
      "shortName": "Anaar",
      "meaning": "pomegranate",
      "category": "necklaces-sets",
      "collections": [
        "necklaces-sets",
        "new",
        "ready-to-ship"
      ],
      "occasions": [
        "cocktail",
        "festive"
      ],
      "tones": [
        "red",
        "green",
        "gold"
      ],
      "price": 21500,
      "availability": {
        "type": "ready",
        "dispatchHours": 48
      },
      "tag": "new",
      "stockLimit": null,
      "addedOn": "2026-10-10",
      "caption": "Red with pavé leaves",
      "hook": "A collar of ruby-red stones, crossed by two pavé leaves with emerald-green hearts.",
      "story": "Anaar is the pomegranate, and this collar is its seeds: ruby-red stones packed close along a curve that sits high on the neck. Two leaves of white pavé cross at the front, each holding an emerald-green drop. The earrings repeat the leaf, so the set reads as one design.",
      "wearLabel": "Wear it with",
      "wearWith": "A black or ivory gown with a deep neckline, or a plain red saree.",
      "inTheSet": [
        "Necklace",
        "Pair of drop earrings"
      ],
      "details": [
        [
          "Finish",
          "Gold-tone plating on brass"
        ],
        [
          "Stones",
          "Ruby-red glass, emerald-green doublets, cubic zirconia pavé"
        ],
        [
          "Closure",
          "Hook with a 6\u00a0cm extender chain"
        ],
        [
          "Size",
          "Necklace 38\u00a0cm (15\u00a0in) at the inner edge; earrings 6.5\u00a0cm (2.6\u00a0in)"
        ],
        [
          "Weight",
          "Necklace 120–130\u00a0g; earrings 26–28\u00a0g the pair"
        ]
      ],
      "code": "PJ-NS-0436",
      "specs": [
        [
          "Stone setting",
          "Ruby-red stones close-set in claws; pavé leaves; bezel-set emerald-green drops"
        ],
        [
          "Stones",
          "Ruby-red glass, emerald-green doublets, cubic zirconia pavé"
        ],
        [
          "Finish",
          "Polished gold-tone plating"
        ],
        [
          "Base",
          "Brass"
        ],
        [
          "Drop",
          "Emerald-green doublet drops in the leaves and the earrings"
        ],
        [
          "Dori",
          "No; a hook and extender chain"
        ],
        [
          "Size",
          "Necklace 38\u00a0cm (15\u00a0in) at the inner edge, 5.5\u00a0cm (2.2\u00a0in) deep at the leaves; earrings 6.5\u00a0cm (2.6\u00a0in) long, 2.8\u00a0cm (1.1\u00a0in) wide"
        ],
        [
          "Weight",
          "Necklace 120–130\u00a0g; earrings 26–28\u00a0g the pair"
        ],
        [
          "Closure",
          "Hook with a 6\u00a0cm (2.4\u00a0in) extender chain; push-back earrings"
        ],
        [
          "Colour",
          "Gold-tone with ruby-red, white and emerald-green"
        ]
      ],
      "care": "jewellery",
      "images": [
        {
          "n": 1,
          "file": "anaar-twin-leaf-collar-set-01-still-life",
          "kind": "still-life",
          "role": "card",
          "colour": null,
          "widths": [
            160,
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Ruby-red collar with twin pavé leaves and emerald-green drops, with its earrings."
        },
        {
          "n": 2,
          "file": "anaar-twin-leaf-collar-set-02-on-model",
          "kind": "on-model",
          "role": "hover",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "55% 50%",
          "alt": "Worn with a red silk slip, the leaves resting at the collarbone."
        },
        {
          "n": 3,
          "file": "anaar-twin-leaf-collar-set-03-detail",
          "kind": "detail",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "The whole collar laid out: ruby-red stones and pavé leaves holding emerald-green drops."
        },
        {
          "n": 4,
          "file": "anaar-twin-leaf-collar-set-04-on-model",
          "kind": "on-model",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "The collar from the front."
        },
        {
          "n": 5,
          "file": "anaar-twin-leaf-collar-set-05-on-model",
          "kind": "on-model",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "In profile, with the matching drop earrings."
        }
      ],
      "colours": [],
      "completeTheLook": [
        "sheesh-mahal-polki-bag",
        "mehtab-pearl-chandbalis"
      ],
      "related": [
        "shahi-panna-polki-bridal-set",
        "lehar-spiral-necklace-set",
        "gulmohar-kundan-jhumkas"
      ],
      "reviews": {
        "average": 4.7,
        "count": 3,
        "items": [
          {
            "name": "Sonal T.",
            "city": "Delhi",
            "date": "2026-10-19",
            "rating": 5,
            "title": "Statement without trying",
            "text": "The red is deep, almost like pomegranate seeds, and the two leaves sit perfectly at the front. I wore it with a black gown and needed nothing else.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Megha A.",
            "city": "Mumbai",
            "date": "2026-10-26",
            "rating": 4,
            "title": null,
            "text": "Gorgeous set and the earrings are surprisingly light. It took a day longer than expected to reach Mumbai, but the team told me in advance.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Pooja V.",
            "city": "Kurukshetra",
            "date": "2026-11-02",
            "rating": 5,
            "title": null,
            "text": "Bought it for my cousin’s cocktail night and got so many compliments. The pavé leaves sparkle in every photo.",
            "verified": true,
            "reply": null
          }
        ]
      }
    },
    {
      "id": "hariyali-kundan-hasli",
      "name": "Hariyali Kundan Hasli",
      "shortName": "Hariyali",
      "meaning": "greenery",
      "category": "necklaces-sets",
      "collections": [
        "necklaces-sets",
        "bridal-edit"
      ],
      "occasions": [
        "bridal",
        "festive"
      ],
      "tones": [
        "green",
        "gold",
        "pearl"
      ],
      "price": 33500,
      "availability": {
        "type": "made-to-order",
        "min": 3,
        "max": 4,
        "unit": "weeks",
        "time": "3–4\u00a0weeks",
        "timeShort": "3–4\u00a0wks"
      },
      "tag": null,
      "stockLimit": null,
      "addedOn": "2026-08-21",
      "caption": "Mint-green fringe",
      "hook": "A rigid kundan-style collar with a fringe of mint-green beads and seed pearls.",
      "story": "The hasli is one of the oldest shapes in Indian jewellery: a rigid collar that rests on the collarbone. Ours is worked all round in textured gold-tone metal and set with kundan-style stones, with mint-green beads and seed pearls along its edge.",
      "wearLabel": "Wear it with",
      "wearWith": "A plain silk saree in ivory or rust, with nothing else at the neck.",
      "decode": {
        "picture": 3,
        "facts": [
          {
            "title": "The centre stone",
            "line": "One large oval of kundan-style glass anchors the front.",
            "dot": [
              55,
              61
            ]
          },
          {
            "title": "Textured gold-tone work",
            "line": "Antique gold-tone plating on brass, worked all round by hand.",
            "dot": [
              24,
              36
            ]
          },
          {
            "title": "Mint-green glass beads",
            "line": "A fringe of mint-green glass beads along the lower edge.",
            "dot": [
              28,
              68
            ]
          },
          {
            "title": "Shell seed pearls",
            "line": "Shell seed pearls between the beads catch the light.",
            "dot": [
              53,
              71.5
            ]
          },
          {
            "title": "Kundan-style settings",
            "line": "Each stone sits in a kundan-style setting, finished by hand.",
            "dot": [
              84,
              66
            ]
          }
        ]
      },
      "inTheSet": [],
      "details": [
        [
          "Finish",
          "Antique gold-tone plating on brass"
        ],
        [
          "Stones",
          "Kundan-style glass, mint-green glass beads, shell seed pearls"
        ],
        [
          "Closure",
          "Hinged at the back, with a hook"
        ],
        [
          "Size",
          "12\u00a0cm (4.7\u00a0in) across the inside; 3\u00a0cm (1.2\u00a0in) deep at the front"
        ],
        [
          "Weight",
          "150–165\u00a0g"
        ]
      ],
      "code": "PJ-NS-0418",
      "specs": [
        [
          "Stone setting",
          "Kundan-style: each stone set flush in gold-tone foil"
        ],
        [
          "Stones",
          "Kundan-style glass, mint-green glass beads, shell seed pearls"
        ],
        [
          "Finish",
          "Antique gold-tone plating, textured by hand"
        ],
        [
          "Base",
          "Brass"
        ],
        [
          "Drop",
          "Mint-green glass beads and shell seed pearls along the lower edge"
        ],
        [
          "Dori",
          "No; a rigid collar"
        ],
        [
          "Size",
          "12\u00a0cm (4.7\u00a0in) across the inside; 3\u00a0cm (1.2\u00a0in) deep at the front, plus a 1.5\u00a0cm (0.6\u00a0in) fringe"
        ],
        [
          "Weight",
          "150–165\u00a0g"
        ],
        [
          "Closure",
          "Hinged at the back, with a hook"
        ],
        [
          "Colour",
          "Antique gold-tone with mint-green and pearl white"
        ]
      ],
      "care": "jewellery",
      "images": [
        {
          "n": 1,
          "file": "hariyali-kundan-hasli-01-still-life",
          "kind": "still-life",
          "role": "card",
          "colour": null,
          "widths": [
            160,
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Gold-tone kundan-style hasli with a fringe of mint-green beads and seed pearls."
        },
        {
          "n": 2,
          "file": "hariyali-kundan-hasli-02-on-model",
          "kind": "on-model",
          "role": "hover",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 0.827,
          "focal": "50% 45%",
          "alt": "Worn with a rust one-shoulder drape."
        },
        {
          "n": 3,
          "file": "hariyali-kundan-hasli-03-detail",
          "kind": "detail",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            2400
          ],
          "ratio": 0.75,
          "focal": "50% 50%",
          "alt": "Close-up of the kundan-style settings and the textured gold-tone work."
        },
        {
          "n": 4,
          "file": "hariyali-kundan-hasli-04-angle",
          "kind": "angle",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200
          ],
          "ratio": 0.75,
          "focal": "50% 50%",
          "alt": "The curve of the collar, seen at an angle."
        },
        {
          "n": 5,
          "file": "hariyali-kundan-hasli-05-still-life",
          "kind": "still-life",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 0.75,
          "focal": "50% 50%",
          "alt": "The whole hasli from above."
        }
      ],
      "colours": [],
      "completeTheLook": [
        "mehtab-pearl-chandbalis",
        "mehfil-jadau-potli"
      ],
      "related": [
        "shahi-panna-polki-bridal-set",
        "anaar-twin-leaf-collar-set",
        "lehar-spiral-necklace-set"
      ],
      "reviews": {
        "average": 4.7,
        "count": 3,
        "items": [
          {
            "name": "Simran K.",
            "city": "Ludhiana",
            "date": "2026-09-26",
            "rating": 5,
            "title": "An heirloom feeling",
            "text": "This hasli feels like something from my nani’s trunk, but brand new. The mint-green beads are the softest shade and it sits exactly on the collarbone.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Ishita J.",
            "city": "Jaipur",
            "date": "2026-10-12",
            "rating": 5,
            "title": null,
            "text": "It took a little under four weeks, as promised, and they sent a photo before dispatch. The kundan-style work is very fine. Worth it for a reception look.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Tanya R.",
            "city": "Karnal",
            "date": "2026-10-29",
            "rating": 4,
            "title": null,
            "text": "Collected it from the store at Kalandri Gate. A beautiful piece; the hook at the back needs a second pair of hands, which I should have expected with a hasli.",
            "verified": true,
            "reply": "Thank you, Tanya, it was lovely to meet you at the store. A small tip: open the hinge fully before you fasten the hook."
          }
        ]
      }
    },
    {
      "id": "lehar-spiral-necklace-set",
      "name": "Lehar Spiral Necklace Set",
      "shortName": "Lehar",
      "meaning": "wave",
      "category": "necklaces-sets",
      "collections": [
        "necklaces-sets",
        "gifting",
        "new",
        "ready-to-ship"
      ],
      "occasions": [
        "everyday",
        "cocktail"
      ],
      "tones": [
        "gold"
      ],
      "price": 9800,
      "availability": {
        "type": "ready",
        "dispatchHours": 48
      },
      "tag": "new",
      "stockLimit": null,
      "addedOn": "2026-10-06",
      "caption": "Four coiled spirals",
      "hook": "Four hand-coiled spirals around domed centres, on a fine gold-tone chain.",
      "story": "Lehar means wave. Each of the four medallions is coiled by hand from gold-tone wire around a smooth domed centre, so no two curl quite alike. It is our quietest statement: modern enough for a white shirt, warm enough for a festive evening. The earrings echo a single spiral.",
      "wearLabel": "Wear it with",
      "wearWith": "A white shirt open at the neck, or an emerald-green or black slip dress.",
      "inTheSet": [
        "Necklace",
        "Pair of stud earrings"
      ],
      "details": [
        [
          "Finish",
          "Brushed gold-tone plating on brass"
        ],
        [
          "Stones",
          "None; hand-coiled wire"
        ],
        [
          "Closure",
          "Lobster clasp with a 5\u00a0cm extender"
        ],
        [
          "Size",
          "Necklace 42\u00a0cm (16.5\u00a0in); medallions 3.2\u00a0cm (1.3\u00a0in) across; earrings 3.5\u00a0cm (1.4\u00a0in)"
        ],
        [
          "Weight",
          "Necklace 68–74\u00a0g; earrings 18–20\u00a0g the pair"
        ]
      ],
      "code": "PJ-NS-0431",
      "specs": [
        [
          "Work",
          "Gold-tone wire coiled by hand around domed centres; no stones"
        ],
        [
          "Finish",
          "Brushed gold-tone plating, polished domes"
        ],
        [
          "Base",
          "Brass"
        ],
        [
          "Dori",
          "No; a fine gold-tone chain"
        ],
        [
          "Size",
          "Necklace 42\u00a0cm (16.5\u00a0in) plus a 5\u00a0cm (2\u00a0in) extender; medallions 3.2\u00a0cm (1.3\u00a0in) across; earrings 3.5\u00a0cm (1.4\u00a0in) across"
        ],
        [
          "Weight",
          "Necklace 68–74\u00a0g; earrings 18–20\u00a0g the pair"
        ],
        [
          "Closure",
          "Lobster clasp with the extender; push-back earrings"
        ],
        [
          "Colour",
          "Brushed gold-tone"
        ]
      ],
      "care": "jewellery",
      "images": [
        {
          "n": 1,
          "file": "lehar-spiral-necklace-set-01-still-life",
          "kind": "still-life",
          "role": "card",
          "colour": null,
          "widths": [
            160,
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Four coiled gold-tone spirals on a fine chain, with the matching stud earrings."
        },
        {
          "n": 2,
          "file": "lehar-spiral-necklace-set-02-on-model",
          "kind": "on-model",
          "role": "hover",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 55%",
          "alt": "Worn with an emerald-green satin drape."
        },
        {
          "n": 3,
          "file": "lehar-spiral-necklace-set-03-detail",
          "kind": "detail",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Close-up of the hand-coiled wire around each domed centre."
        },
        {
          "n": 4,
          "file": "lehar-spiral-necklace-set-04-on-model",
          "kind": "on-model",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "In profile, with the spiral earring."
        }
      ],
      "colours": [],
      "completeTheLook": [
        "vantara-bhanwra-bee-studs",
        "vantara-hiran-nano-bag"
      ],
      "related": [
        "anaar-twin-leaf-collar-set",
        "hariyali-kundan-hasli",
        "gulmohar-kundan-jhumkas"
      ],
      "reviews": {
        "average": 4.6,
        "count": 5,
        "items": [
          {
            "name": "Devika P.",
            "city": "Gurugram",
            "date": "2026-10-14",
            "rating": 5,
            "title": "My everyday statement",
            "text": "I wear it to work with white shirts and it always gets noticed. The spirals look hand-made in the best way, each one slightly different.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Riya C.",
            "city": "Delhi",
            "date": "2026-10-18",
            "rating": 3,
            "title": "Shorter than I expected",
            "text": "Lovely design and finish, but the chain sat higher on my neck than I expected from the photos. The extender fixed it. The earrings are perfect.",
            "verified": true,
            "reply": "Thank you, Riya. The chain is 42\u00a0cm with a 5\u00a0cm extender; if you would like it longer, message us and we will add a few centimetres free of charge."
          },
          {
            "name": "Ananya K.",
            "city": "Chandigarh",
            "date": "2026-10-22",
            "rating": 5,
            "title": null,
            "text": "Light, modern and very well made. I bought one for myself and one for my sister’s birthday.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Mehak S.",
            "city": "Panipat",
            "date": "2026-10-27",
            "rating": 5,
            "title": null,
            "text": "The brushed finish is so elegant, not flashy at all. It arrived in two days in the red box with a little care card.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Zoya H.",
            "city": "Dubai",
            "date": "2026-10-30",
            "rating": 5,
            "title": "A lovely gift",
            "text": "I gifted it to my mother and she has not taken it off since. Shipping to Dubai was quick and the team answered every question on WhatsApp.",
            "verified": true,
            "reply": null
          }
        ]
      }
    },
    {
      "id": "mehtab-pearl-chandbalis",
      "name": "Mehtab Pearl Chandbalis",
      "shortName": "Mehtab",
      "meaning": "moonlight",
      "category": "earrings",
      "collections": [
        "earrings",
        "bridal-edit",
        "gifting",
        "ready-to-ship"
      ],
      "occasions": [
        "festive",
        "bridal"
      ],
      "tones": [
        "red",
        "pearl",
        "green"
      ],
      "price": 8600,
      "availability": {
        "type": "ready",
        "dispatchHours": 48
      },
      "tag": null,
      "stockLimit": null,
      "addedOn": "2026-08-21",
      "caption": "Crescent and pearls",
      "hook": "A crescent of ruby-red and clear stones under a kundan-style flower, fringed with pearls.",
      "story": "Mehtab is moonlight, and the chandbali is the moon’s own shape. A small kundan-style flower sits at the lobe; below it hangs a crescent set with ruby-red and clear stones, fringed with shell pearls and green beads that sway as you move. A light ear chain takes the weight.",
      "wearLabel": "Wear it with",
      "wearWith": "A braid or a low bun, with a cotton suit for mehendi or a lehenga for Diwali.",
      "inTheSet": [],
      "details": [
        [
          "Finish",
          "Gold-tone plating on brass"
        ],
        [
          "Stones",
          "Kundan-style glass, ruby-red and emerald-green glass, shell pearls, green glass beads"
        ],
        [
          "Closure",
          "Push-back with a detachable ear chain (sahara)"
        ],
        [
          "Size",
          "8\u00a0cm (3.1\u00a0in) long, 5.5\u00a0cm (2.2\u00a0in) wide"
        ],
        [
          "Weight",
          "22–25\u00a0g each"
        ]
      ],
      "code": "PJ-ER-0207",
      "specs": [
        [
          "Stone setting",
          "Kundan-style flower at the lobe; ruby-red and clear stones close-set along the crescent"
        ],
        [
          "Stones",
          "Kundan-style glass, ruby-red and emerald-green glass, shell pearls, green glass beads"
        ],
        [
          "Finish",
          "Gold-tone plating"
        ],
        [
          "Base",
          "Brass"
        ],
        [
          "Drop",
          "Shell pearls and green glass beads along the crescent"
        ],
        [
          "Ear chain",
          "Yes, a detachable sahara, 9\u00a0cm (3.5\u00a0in)"
        ],
        [
          "Size",
          "8\u00a0cm (3.1\u00a0in) long, 5.5\u00a0cm (2.2\u00a0in) wide"
        ],
        [
          "Weight",
          "22–25\u00a0g each"
        ],
        [
          "Closure",
          "Push-back, with the ear chain to take the weight"
        ],
        [
          "Colour",
          "Gold-tone with ruby-red, white, pearl and green"
        ]
      ],
      "care": "jewellery",
      "images": [
        {
          "n": 1,
          "file": "mehtab-pearl-chandbalis-01-still-life",
          "kind": "still-life",
          "role": "card",
          "colour": null,
          "widths": [
            160,
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Chandbali with a flower top, a ruby-red crescent and drops of pearls and green beads."
        },
        {
          "n": 2,
          "file": "mehtab-pearl-chandbalis-02-on-model",
          "kind": "on-model",
          "role": "hover",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "40% 50%",
          "alt": "Worn with a rust drape, hair swept back."
        },
        {
          "n": 3,
          "file": "mehtab-pearl-chandbalis-03-on-model",
          "kind": "on-model",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Close view on the ear, showing the length of the drop."
        },
        {
          "n": 4,
          "file": "mehtab-pearl-chandbalis-04-angle",
          "kind": "angle",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "One chandbali at an angle, showing the depth of the crescent."
        },
        {
          "n": 5,
          "file": "mehtab-pearl-chandbalis-05-still-life",
          "kind": "still-life",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "One chandbali on a mustard ground."
        },
        {
          "n": 6,
          "file": "mehtab-pearl-chandbalis-06-on-model",
          "kind": "on-model",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "45% 50%",
          "alt": "In profile, the chandbali swinging below the ear."
        }
      ],
      "colours": [],
      "completeTheLook": [
        "shahi-panna-polki-bridal-set",
        "mehfil-jadau-potli"
      ],
      "related": [
        "gulmohar-kundan-jhumkas",
        "vantara-bhanwra-bee-studs",
        "hariyali-kundan-hasli"
      ],
      "reviews": {
        "average": 4.9,
        "count": 9,
        "items": [
          {
            "name": "Aditi V.",
            "city": "Karnal",
            "date": "2026-08-29",
            "rating": 5,
            "title": "Love at first sight",
            "text": "I saw them in the store’s opening week and went back the next day to buy them. The sahara chain makes them comfortable for hours.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Prerna D.",
            "city": "Ludhiana",
            "date": "2026-09-07",
            "rating": 5,
            "title": null,
            "text": "The pearls and little green beads move so prettily when you turn your head. I wore them with a braid for a mehendi and felt like the bride’s favourite cousin.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Shreya M.",
            "city": "Delhi",
            "date": "2026-09-15",
            "rating": 5,
            "title": null,
            "text": "Exactly as pictured. The red stones are rich, not pinkish, and the finish has a soft antique glow.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Navneet K.",
            "city": "Chandigarh",
            "date": "2026-09-24",
            "rating": 4,
            "title": "Wear them with the ear chain",
            "text": "They have some weight to them, so I use the ear chain every time. With it they are perfectly comfortable through a long function.",
            "verified": true,
            "reply": "Thank you, Navneet. The sahara is there for exactly that, and we are glad it helps."
          },
          {
            "name": "Bhavna T.",
            "city": "Jaipur",
            "date": "2026-10-02",
            "rating": 5,
            "title": null,
            "text": "I ordered a pair for me and one for my bhabhi. Both arrived beautifully boxed, each with a care card.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Jasleen A.",
            "city": "Panipat",
            "date": "2026-10-09",
            "rating": 5,
            "title": "Five stars for the service too",
            "text": "I messaged at ten at night about delivery and got a reply in minutes. The earrings came in two days.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Kriti L.",
            "city": "Gurugram",
            "date": "2026-10-17",
            "rating": 5,
            "title": null,
            "text": "My go-to festive earrings now. They photograph beautifully, especially in evening light.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Muskan R.",
            "city": "Kurukshetra",
            "date": "2026-10-25",
            "rating": 5,
            "title": null,
            "text": "I gifted these to my best friend for her engagement. She wore them on the day and they looked stunning with her red lehenga.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Aarohi S.",
            "city": "Mumbai",
            "date": "2026-11-01",
            "rating": 5,
            "title": null,
            "text": "This is the third piece I have bought from Pynora. The quality is consistent and the packaging is the loveliest I have received.",
            "verified": true,
            "reply": null
          }
        ]
      }
    },
    {
      "id": "gulmohar-kundan-jhumkas",
      "name": "Gulmohar Kundan Jhumkas",
      "shortName": "Gulmohar",
      "meaning": "the red-flowering tree",
      "category": "earrings",
      "collections": [
        "earrings",
        "gifting",
        "new",
        "ready-to-ship"
      ],
      "occasions": [
        "festive",
        "everyday"
      ],
      "tones": [
        "red",
        "green",
        "pearl"
      ],
      "price": 6400,
      "availability": {
        "type": "ready",
        "dispatchHours": 48
      },
      "tag": "new",
      "stockLimit": null,
      "addedOn": "2026-10-08",
      "caption": "Bloom stud, red dome",
      "hook": "A kundan-style bloom at the lobe, and a red-banded dome fringed with pearls.",
      "story": "Named for the gulmohar tree that flowers red across Haryana every summer. A kundan-style bloom with an emerald-green heart sits at the lobe, and below it a dome jhumka banded in ruby-red stones, finished with seed pearls and soft green bead drops. Six centimetres long, and only sixteen grams.",
      "wearLabel": "Wear it with",
      "wearWith": "Hair tucked behind the ear, with an ivory chikankari kurta or a festive saree.",
      "inTheSet": [],
      "details": [
        [
          "Finish",
          "Gold-tone plating on brass"
        ],
        [
          "Stones",
          "Kundan-style glass, emerald-green and ruby-red glass, shell seed pearls, green glass beads"
        ],
        [
          "Closure",
          "Push-back"
        ],
        [
          "Size",
          "6\u00a0cm (2.4\u00a0in) long"
        ],
        [
          "Weight",
          "16\u00a0g each"
        ]
      ],
      "code": "PJ-ER-0233",
      "specs": [
        [
          "Stone setting",
          "Kundan-style bloom at the lobe; ruby-red stones channel-set in bands around the dome"
        ],
        [
          "Stones",
          "Kundan-style glass, emerald-green and ruby-red glass, shell seed pearls, green glass beads"
        ],
        [
          "Finish",
          "Gold-tone plating"
        ],
        [
          "Base",
          "Brass"
        ],
        [
          "Drop",
          "Shell seed pearls and green glass beads around the dome"
        ],
        [
          "Size",
          "6\u00a0cm (2.4\u00a0in) long; bloom 2.4\u00a0cm (0.9\u00a0in) across; dome 2.2\u00a0cm (0.9\u00a0in) across"
        ],
        [
          "Weight",
          "16\u00a0g each"
        ],
        [
          "Closure",
          "Push-back"
        ],
        [
          "Colour",
          "Gold-tone with ruby-red, emerald-green and pearl"
        ]
      ],
      "care": "jewellery",
      "images": [
        {
          "n": 1,
          "file": "gulmohar-kundan-jhumkas-01-still-life",
          "kind": "still-life",
          "role": "card",
          "colour": null,
          "widths": [
            160,
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Kundan-style flower stud and jhumka with ruby-red bands, pearls and green bead drops."
        },
        {
          "n": 2,
          "file": "gulmohar-kundan-jhumkas-02-on-model",
          "kind": "on-model",
          "role": "hover",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "45% 50%",
          "alt": "Worn with a rust drape, in profile."
        },
        {
          "n": 3,
          "file": "gulmohar-kundan-jhumkas-03-angle",
          "kind": "angle",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "One earring at an angle on a taupe ground, the bloom and the dome side by side."
        },
        {
          "n": 4,
          "file": "gulmohar-kundan-jhumkas-04-still-life",
          "kind": "still-life",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "One earring on a mustard ground."
        }
      ],
      "colours": [],
      "completeTheLook": [
        "hariyali-kundan-hasli",
        "vantara-hiran-nano-bag"
      ],
      "related": [
        "mehtab-pearl-chandbalis",
        "vantara-bhanwra-bee-studs",
        "lehar-spiral-necklace-set"
      ],
      "reviews": {
        "average": 4.8,
        "count": 5,
        "items": [
          {
            "name": "Tanvi R.",
            "city": "Mumbai",
            "date": "2026-10-16",
            "rating": 5,
            "title": "Tiny and perfect",
            "text": "Only six centimetres, so they are easy to wear all day, but the little dome and green drops still feel festive.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Ira B.",
            "city": "Delhi",
            "date": "2026-10-20",
            "rating": 5,
            "title": null,
            "text": "The red bands on the jhumka are such a pretty touch. I wear them with a white chikankari kurta.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Shalini G.",
            "city": "Karnal",
            "date": "2026-10-24",
            "rating": 4,
            "title": null,
            "text": "Lovely, light jhumkas. I would have liked a slightly bigger back for the push-back, but they have stayed in all evening.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Rhea N.",
            "city": "Ludhiana",
            "date": "2026-10-28",
            "rating": 5,
            "title": null,
            "text": "Ordered on Monday, arrived on Wednesday. The kundan-style bloom catches the light beautifully.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Neha J.",
            "city": "Jaipur",
            "date": "2026-11-02",
            "rating": 5,
            "title": "A gift for my sister",
            "text": "I bought them as a birthday gift and the handwritten note was such a sweet touch. She loved them.",
            "verified": true,
            "reply": null
          }
        ]
      }
    },
    {
      "id": "vantara-bhanwra-bee-studs",
      "name": "Vantara Bhanwra Bee Studs",
      "shortName": "Bhanwra",
      "meaning": "bumblebee",
      "category": "earrings",
      "collections": [
        "earrings",
        "vantara",
        "gifting"
      ],
      "occasions": [
        "everyday",
        "cocktail"
      ],
      "tones": [
        "white",
        "gold"
      ],
      "price": 5800,
      "availability": {
        "type": "made-to-order",
        "min": 10,
        "max": 12,
        "unit": "days",
        "time": "10–12\u00a0days",
        "timeShort": "10–12\u00a0days"
      },
      "tag": null,
      "stockLimit": null,
      "addedOn": "2026-08-21",
      "caption": "A pavé bee in bloom",
      "hook": "A bee in clear-stone petals, with three gold-tone beads at its heart.",
      "story": "From Vantara, our collection of animals in jewels. Bhanwra is the bumblebee, here caught as it lands: petals of clear stones fan out around three round gold-tone beads, and textured wings lift at the sides. Small, light and close to the ear, made only when you order it.",
      "wearLabel": "Wear it with",
      "wearWith": "A white kurta, a denim jacket or a little black dress. Every day, really.",
      "inTheSet": [],
      "details": [
        [
          "Finish",
          "Gold-tone plating on brass"
        ],
        [
          "Stones",
          "Cubic zirconia"
        ],
        [
          "Closure",
          "Push-back with silicone stoppers"
        ],
        [
          "Size",
          "3.4\u00a0cm (1.3\u00a0in) across"
        ],
        [
          "Weight",
          "7–8\u00a0g each"
        ]
      ],
      "code": "PJ-ER-0219",
      "specs": [
        [
          "Stone setting",
          "Marquise and round cubic zirconia in claw settings"
        ],
        [
          "Stones",
          "Cubic zirconia"
        ],
        [
          "Finish",
          "Gold-tone plating; textured wings"
        ],
        [
          "Base",
          "Brass"
        ],
        [
          "Size",
          "3.4\u00a0cm (1.3\u00a0in) across, 2.9\u00a0cm (1.1\u00a0in) tall"
        ],
        [
          "Weight",
          "7–8\u00a0g each"
        ],
        [
          "Closure",
          "Push-back with silicone stoppers"
        ],
        [
          "Colour",
          "Gold-tone with clear stones"
        ]
      ],
      "care": "jewellery",
      "images": [
        {
          "n": 1,
          "file": "vantara-bhanwra-bee-studs-01-detail",
          "kind": "detail",
          "role": "card",
          "colour": null,
          "widths": [
            160,
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Bee stud with clear-stone petals, textured wings and three gold-tone beads."
        },
        {
          "n": 2,
          "file": "vantara-bhanwra-bee-studs-02-on-model",
          "kind": "on-model",
          "role": "hover",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "42% 50%",
          "alt": "Worn with a rust drape, hair slicked back."
        },
        {
          "n": 3,
          "file": "vantara-bhanwra-bee-studs-03-on-model",
          "kind": "on-model",
          "role": "gallery",
          "colour": null,
          "widths": [
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Close view on the ear."
        },
        {
          "n": 4,
          "file": "vantara-bhanwra-bee-studs-04-still-life",
          "kind": "still-life",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "One stud on a mustard ground."
        }
      ],
      "colours": [],
      "completeTheLook": [
        "lehar-spiral-necklace-set",
        "vantara-hiran-nano-bag"
      ],
      "related": [
        "gulmohar-kundan-jhumkas",
        "mehtab-pearl-chandbalis",
        "vantara-gaj-sindoor-box"
      ],
      "reviews": {
        "average": 4.9,
        "count": 8,
        "items": [
          {
            "name": "Saanvi M.",
            "city": "Gurugram",
            "date": "2026-09-09",
            "rating": 5,
            "title": "The cutest studs",
            "text": "The little bee is so detailed; even the wings have texture. Worth the ten-day wait.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Avni K.",
            "city": "Chandigarh",
            "date": "2026-09-17",
            "rating": 5,
            "title": null,
            "text": "I wear them every single day, office to dinner. Light and very comfortable.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Diya S.",
            "city": "Karnal",
            "date": "2026-09-28",
            "rating": 5,
            "title": null,
            "text": "After a week of wearing mine, I ordered a second pair as a gift for a friend.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Kashish B.",
            "city": "Delhi",
            "date": "2026-10-04",
            "rating": 4,
            "title": null,
            "text": "Sparkly and sweet. They sit close to the ear and are a touch smaller than I imagined, but I have grown to love that.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Ananya T.",
            "city": "Panipat",
            "date": "2026-10-11",
            "rating": 5,
            "title": "A gift that felt personal",
            "text": "I gave them to my mother-in-law, who loves bees. The red box and the handwritten note made it feel very special.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Mahi D.",
            "city": "Mumbai",
            "date": "2026-10-19",
            "rating": 5,
            "title": null,
            "text": "So much nicer in person. The three gold-tone beads in the centre catch every light.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Nisha A.",
            "city": "Kurukshetra",
            "date": "2026-10-26",
            "rating": 5,
            "title": null,
            "text": "Ordered them for a friend’s birthday. The team added a gift note on WhatsApp and they arrived three days after the photo.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Pihu G.",
            "city": "Ludhiana",
            "date": "2026-10-29",
            "rating": 5,
            "title": null,
            "text": "My favourite everyday studs by far. The silicone stoppers keep them secure all day.",
            "verified": true,
            "reply": null
          }
        ]
      }
    },
    {
      "id": "sheesh-mahal-polki-bag",
      "name": "Sheesh Mahal Polki Bag",
      "shortName": "Sheesh Mahal",
      "meaning": "palace of mirrors",
      "category": "bags",
      "collections": [
        "bags",
        "ready-to-ship"
      ],
      "occasions": [
        "bridal",
        "festive",
        "cocktail"
      ],
      "tones": [
        "gold",
        "white"
      ],
      "price": 18900,
      "availability": {
        "type": "ready",
        "dispatchHours": 48
      },
      "tag": "founders-pick",
      "stockLimit": 2,
      "addedOn": "2026-08-21",
      "caption": "Mirrored half-moon",
      "hook": "A half-moon bag of mirror-bright polki-style stones, with a fringe of crystal drops.",
      "story": "Sheesh Mahal, the palace of mirrors, is where this bag takes its light. Its front is built up by hand like a jewelled bib, in polki-style stones, crystals and gold zardozi, and a fringe of crystal drops swings from its curve. Carry it by the ring handle, or on its chain.",
      "wearLabel": "Wear it with",
      "wearWith": "Gold tissue or ivory for a wedding; a black drape for a cocktail evening.",
      "inTheSet": [],
      "details": [
        [
          "Body",
          "Zardozi-embroidered satin on a structured frame"
        ],
        [
          "Stones",
          "Polki-style glass, crystals, a crystal drop fringe"
        ],
        [
          "Handle",
          "Gold-tone ring handle, plus a detachable 110\u00a0cm (43\u00a0in) chain"
        ],
        [
          "Closure",
          "Magnetic snap; satin lining"
        ],
        [
          "Size",
          "20\u00a0×\u00a015\u00a0×\u00a06\u00a0cm (7.9\u00a0×\u00a05.9\u00a0×\u00a02.4\u00a0in); holds a phone up to 6.1\u00a0in, keys and a lipstick"
        ],
        [
          "Weight",
          "480–520\u00a0g"
        ]
      ],
      "code": "PJ-BG-0105",
      "specs": [
        [
          "Material",
          "Zardozi-embroidered satin on a structured frame"
        ],
        [
          "Embellishment",
          "Polki-style glass, crystals and gold zardozi, with a crystal drop fringe"
        ],
        [
          "Finish",
          "Antique gold-tone frame and fittings"
        ],
        [
          "Finding",
          "Gold-tone ring handle, plus a detachable chain"
        ],
        [
          "Size",
          "20\u00a0×\u00a015\u00a0×\u00a06\u00a0cm (7.9\u00a0×\u00a05.9\u00a0×\u00a02.4\u00a0in); holds a phone up to 6.1\u00a0in, keys and a lipstick"
        ],
        [
          "Chain drop",
          "110\u00a0cm (43\u00a0in) chain, for a 52\u00a0cm (20.5\u00a0in) drop"
        ],
        [
          "Lining",
          "Satin, with a slip pocket"
        ],
        [
          "Closure",
          "Magnetic snap"
        ],
        [
          "Weight",
          "480–520\u00a0g"
        ],
        [
          "Colour",
          "Antique gold-tone with clear crystals"
        ]
      ],
      "care": "bag",
      "images": [
        {
          "n": 1,
          "file": "sheesh-mahal-polki-bag-01-on-model",
          "kind": "on-model",
          "role": "card",
          "colour": null,
          "widths": [
            160,
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Half-moon bag of polki-style stones with a crystal fringe, held by its ring handle."
        },
        {
          "n": 2,
          "file": "sheesh-mahal-polki-bag-02-on-model",
          "kind": "on-model",
          "role": "hover",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "45% 50%",
          "alt": "The crystal fringe swinging as the bag moves."
        },
        {
          "n": 3,
          "file": "sheesh-mahal-polki-bag-03-angle",
          "kind": "angle",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "45% 50%",
          "alt": "The bag at an angle against a deep red ground."
        },
        {
          "n": 4,
          "file": "sheesh-mahal-polki-bag-04-detail",
          "kind": "detail",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Close-up of the polki-style stones and gold-thread embroidery."
        },
        {
          "n": 5,
          "file": "sheesh-mahal-polki-bag-05-on-model",
          "kind": "on-model",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Carried with a gold tissue saree."
        }
      ],
      "colours": [],
      "completeTheLook": [
        "anaar-twin-leaf-collar-set",
        "mehtab-pearl-chandbalis"
      ],
      "related": [
        "mehfil-jadau-potli",
        "vantara-hiran-nano-bag",
        "shikhar-temple-sindoor-box"
      ],
      "reviews": {
        "average": 4.6,
        "count": 5,
        "items": [
          {
            "name": "Gurleen K.",
            "city": "Chandigarh",
            "date": "2026-08-30",
            "rating": 5,
            "title": "The showstopper",
            "text": "I carried it at my brother’s wedding and it caught the light in every photo. The crystal fringe swings so beautifully.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Rashmi V.",
            "city": "Delhi",
            "date": "2026-09-12",
            "rating": 3,
            "title": "Beautiful but heavy",
            "text": "It is gorgeous and very well made, but heavier than it looks. I ended up carrying it on the chain instead of by the handle.",
            "verified": true,
            "reply": "Thank you, Rashmi. It weighs about half a kilo, so the chain is the comfortable way to carry it on long evenings. We are so glad you still love it."
          },
          {
            "name": "Sakshi P.",
            "city": "Karnal",
            "date": "2026-09-26",
            "rating": 5,
            "title": null,
            "text": "I picked it up from the store and Divi showed me how the chain clips on. It fits my phone, keys and a lipstick.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Ishani M.",
            "city": "Gurugram",
            "date": "2026-10-10",
            "rating": 5,
            "title": null,
            "text": "Worth every rupee. The stones look like little mirrors, exactly as the name says.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Mitali S.",
            "city": "Jaipur",
            "date": "2026-10-28",
            "rating": 5,
            "title": null,
            "text": "I ordered it for a cocktail night with a black saree. Everyone asked about the bag before they asked about my outfit.",
            "verified": true,
            "reply": null
          }
        ]
      }
    },
    {
      "id": "mehfil-jadau-potli",
      "name": "Mehfil Jadau Potli",
      "shortName": "Mehfil",
      "meaning": "an evening gathering",
      "category": "bags",
      "collections": [
        "bags",
        "bridal-edit",
        "new",
        "ready-to-ship"
      ],
      "occasions": [
        "bridal",
        "festive"
      ],
      "tones": [
        "red",
        "pearl"
      ],
      "price": 13400,
      "availability": {
        "type": "ready",
        "dispatchHours": 48
      },
      "tag": "new",
      "stockLimit": null,
      "addedOn": "2026-10-12",
      "caption": "Jadau on maroon",
      "hook": "A maroon potli worked in stones, pearls and fine wire, on a beaded handle.",
      "story": "A mehfil is an evening of music and company, and this is the potli for it. Deep maroon satin is worked by hand in jadau: faceted stones, kundan-style settings, glass beads and baroque-look pearls, laid with fine French wire. Jewelled tassels finish the drawstring.",
      "wearLabel": "Wear it with",
      "wearWith": "A red or wine lehenga, or an ivory saree with a maroon border.",
      "inTheSet": [],
      "details": [
        [
          "Body",
          "Maroon satin with jadau handwork"
        ],
        [
          "Detail",
          "Faceted glass stones, kundan-style settings, glass beads, baroque-look shell pearls, French wire (dabka)"
        ],
        [
          "Handle",
          "Beaded ring handle"
        ],
        [
          "Closure",
          "Drawstring with jewelled tassels; satin lining"
        ],
        [
          "Size",
          "22\u00a0×\u00a020\u00a0cm (8.7\u00a0×\u00a07.9\u00a0in); holds a phone, keys and cards"
        ],
        [
          "Weight",
          "380–420\u00a0g"
        ]
      ],
      "code": "PJ-BG-0128",
      "specs": [
        [
          "Material",
          "Maroon satin with jadau handwork"
        ],
        [
          "Embellishment",
          "Faceted glass stones, kundan-style settings, glass beads, baroque-look shell pearls, French wire (dabka)"
        ],
        [
          "Finish",
          "Antique gold-tone settings and wirework"
        ],
        [
          "Finding",
          "Beaded ring handle, 13\u00a0cm (5.1\u00a0in) across"
        ],
        [
          "Size",
          "22\u00a0×\u00a020\u00a0cm (8.7\u00a0×\u00a07.9\u00a0in), gathered; holds a phone, keys and cards"
        ],
        [
          "Handle drop",
          "11\u00a0cm (4.3\u00a0in)"
        ],
        [
          "Lining",
          "Satin"
        ],
        [
          "Closure",
          "Drawstring with jewelled tassels"
        ],
        [
          "Weight",
          "380–420\u00a0g"
        ],
        [
          "Colour",
          "Maroon with gold-tone and pearl"
        ]
      ],
      "care": "bag",
      "images": [
        {
          "n": 1,
          "file": "mehfil-jadau-potli-01-on-model",
          "kind": "on-model",
          "role": "card",
          "colour": null,
          "widths": [
            160,
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "Maroon potli with jadau embroidery, held by its beaded ring handle."
        },
        {
          "n": 2,
          "file": "mehfil-jadau-potli-02-still-life",
          "kind": "still-life",
          "role": "hover",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "45% 50%",
          "alt": "The potli on a banana leaf, its jewelled tassels beside it."
        },
        {
          "n": 3,
          "file": "mehfil-jadau-potli-03-angle",
          "kind": "angle",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "The back of the potli, gathered into a round."
        },
        {
          "n": 4,
          "file": "mehfil-jadau-potli-04-detail",
          "kind": "detail",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 1,
          "focal": "50% 50%",
          "alt": "The embroidered drawstring tassels, finished with pearls."
        }
      ],
      "colours": [],
      "completeTheLook": [
        "shahi-panna-polki-bridal-set",
        "mehtab-pearl-chandbalis"
      ],
      "related": [
        "sheesh-mahal-polki-bag",
        "vantara-hiran-nano-bag",
        "shikhar-temple-sindoor-box"
      ],
      "reviews": {
        "average": 4.7,
        "count": 3,
        "items": [
          {
            "name": "Roshni A.",
            "city": "Panipat",
            "date": "2026-10-21",
            "rating": 5,
            "title": "So much handwork",
            "text": "The maroon is rich and the stone work is dense and neat. The beaded handle feels sturdy.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Payal K.",
            "city": "Delhi",
            "date": "2026-10-27",
            "rating": 4,
            "title": null,
            "text": "A beautiful potli that fits my phone and keys. The drawstring tassels are a little long for my taste, but very pretty.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Vaani S.",
            "city": "Karnal",
            "date": "2026-10-31",
            "rating": 5,
            "title": null,
            "text": "I bought it for my wedding functions and it went with every outfit. Lovely packaging too.",
            "verified": true,
            "reply": null
          }
        ]
      }
    },
    {
      "id": "vantara-hiran-nano-bag",
      "name": "Vantara Hiran Nano Bag",
      "shortName": "Hiran",
      "meaning": "deer",
      "category": "bags",
      "collections": [
        "bags",
        "vantara",
        "gifting"
      ],
      "occasions": [
        "festive",
        "cocktail"
      ],
      "tones": [
        "red",
        "black",
        "ivory"
      ],
      "price": 6600,
      "availability": {
        "type": "made-to-order",
        "min": 2,
        "max": 3,
        "unit": "weeks",
        "time": "2–3\u00a0weeks",
        "timeShort": "2–3\u00a0wks"
      },
      "tag": null,
      "stockLimit": null,
      "addedOn": "2026-08-21",
      "caption": "Two jewelled deer",
      "hook": "A tiny box bag with a zardozi palm tree and two jewelled deer.",
      "story": "From Vantara, our animals in jewels. Hiran is the deer: two of them stand beneath a palm tree worked in gold zardozi, on a little box bag of satin hung from a gold-tone bangle handle. Small enough for a lipstick and a pair of studs, made to order in three colours.",
      "wearLabel": "Wear it with",
      "wearWith": "Black with a gold tissue saree, sindoori with ivory, ivory with anything.",
      "inTheSet": [],
      "details": [
        [
          "Body",
          "Satin with zardozi embroidery"
        ],
        [
          "Detail",
          "Two jewelled gold-tone deer"
        ],
        [
          "Handle",
          "Gold-tone bangle handle"
        ],
        [
          "Closure",
          "Hinged lid"
        ],
        [
          "Size",
          "10\u00a0×\u00a07\u00a0×\u00a06.5\u00a0cm (3.9\u00a0×\u00a02.8\u00a0×\u00a02.6\u00a0in); holds a lipstick, cards and earbuds, not a phone"
        ],
        [
          "Weight",
          "210–240\u00a0g"
        ]
      ],
      "code": "PJ-BG-0112",
      "specs": [
        [
          "Material",
          "Satin over a structured box frame, with zardozi embroidery"
        ],
        [
          "Embellishment",
          "A gold zardozi palm tree, two jewelled gold-tone deer and a tassel charm"
        ],
        [
          "Finish",
          "Gold-tone handle and fittings"
        ],
        [
          "Finding",
          "Gold-tone bangle handle"
        ],
        [
          "Size",
          "10\u00a0×\u00a07\u00a0×\u00a06.5\u00a0cm (3.9\u00a0×\u00a02.8\u00a0×\u00a02.6\u00a0in); holds a lipstick, cards and earbuds, not a phone"
        ],
        [
          "Handle drop",
          "9\u00a0cm (3.5\u00a0in)"
        ],
        [
          "Lining",
          "Satin"
        ],
        [
          "Closure",
          "Hinged lid"
        ],
        [
          "Weight",
          "210–240\u00a0g"
        ],
        [
          "Colour",
          "Sindoori, Black or Ivory, each with gold zardozi"
        ]
      ],
      "care": "bag",
      "images": [
        {
          "n": 1,
          "file": "vantara-hiran-nano-bag-01-sindoori-still-life",
          "kind": "sindoori-still-life",
          "role": "card",
          "colour": "sindoori",
          "widths": [
            160,
            320,
            480,
            800,
            1200
          ],
          "ratio": 0.75,
          "focal": "50% 50%",
          "alt": "Sindoori red nano bag with a zardozi palm and two jewelled deer."
        },
        {
          "n": 2,
          "file": "vantara-hiran-nano-bag-02-sindoori-angle",
          "kind": "sindoori-angle",
          "role": "hover",
          "colour": "sindoori",
          "widths": [
            480,
            800,
            1200
          ],
          "ratio": 0.75,
          "focal": "50% 50%",
          "alt": "The sindoori bag at an angle on its stand."
        },
        {
          "n": 3,
          "file": "vantara-hiran-nano-bag-03-sindoori-detail",
          "kind": "sindoori-detail",
          "role": "gallery",
          "colour": "sindoori",
          "widths": [
            480,
            800,
            1200
          ],
          "ratio": 0.75,
          "focal": "50% 50%",
          "alt": "Close-up of the jewelled deer and the palm embroidery."
        },
        {
          "n": 4,
          "file": "vantara-hiran-nano-bag-04-black-still-life",
          "kind": "black-still-life",
          "role": "colour-card",
          "colour": "black",
          "widths": [
            160,
            320,
            480,
            800,
            1200
          ],
          "ratio": 0.75,
          "focal": "50% 50%",
          "alt": "Black nano bag with a gold zardozi palm and jewelled deer."
        },
        {
          "n": 5,
          "file": "vantara-hiran-nano-bag-05-black-detail",
          "kind": "black-detail",
          "role": "gallery",
          "colour": "black",
          "widths": [
            480,
            800,
            1200
          ],
          "ratio": 0.75,
          "focal": "50% 50%",
          "alt": "Close-up of the black bag, its palm and deer."
        },
        {
          "n": 6,
          "file": "vantara-hiran-nano-bag-06-ivory-on-model",
          "kind": "ivory-on-model",
          "role": "colour-card",
          "colour": "ivory",
          "widths": [
            160,
            320,
            480,
            800,
            1200
          ],
          "ratio": 0.75,
          "focal": "50% 55%",
          "alt": "Ivory nano bag held by its gold-tone bangle handle."
        },
        {
          "n": 7,
          "file": "vantara-hiran-nano-bag-07-ivory-on-model",
          "kind": "ivory-on-model",
          "role": "gallery",
          "colour": "ivory",
          "widths": [
            480,
            800,
            1200
          ],
          "ratio": 0.667,
          "focal": "50% 55%",
          "alt": "The ivory bag carried with a black silk saree with a gold border."
        }
      ],
      "colours": [
        {
          "id": "sindoori",
          "name": "Sindoori",
          "swatch": "#B92E1E",
          "images": [
            1,
            2,
            3
          ]
        },
        {
          "id": "black",
          "name": "Black",
          "swatch": "#1F1714",
          "images": [
            4,
            5
          ]
        },
        {
          "id": "ivory",
          "name": "Ivory",
          "swatch": "#E9D3B0",
          "images": [
            6,
            7
          ]
        }
      ],
      "completeTheLook": [
        "vantara-bhanwra-bee-studs",
        "gulmohar-kundan-jhumkas"
      ],
      "related": [
        "sheesh-mahal-polki-bag",
        "mehfil-jadau-potli",
        "vantara-gaj-sindoor-box"
      ],
      "reviews": {
        "average": 4.9,
        "count": 7,
        "items": [
          {
            "name": "Tara M.",
            "city": "Gurugram",
            "date": "2026-09-19",
            "rating": 5,
            "title": "Tiny and adorable",
            "text": "I ordered the black one. The two little deer under the palm are so charming, and it holds my lipstick and cards, which is all I need for dinner.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Anushka B.",
            "city": "Chandigarh",
            "date": "2026-09-30",
            "rating": 5,
            "title": null,
            "text": "The sindoori colour is even richer in person. They sent a photo before dispatch, which I loved.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Ruchi T.",
            "city": "Delhi",
            "date": "2026-10-08",
            "rating": 4,
            "title": "Small, as described",
            "text": "Exactly as described: it is truly nano, so do not expect a phone to fit. The embroidery is beautiful.",
            "verified": true,
            "reply": "Thank you, Ruchi. It is our smallest bag, made for the essentials, and we are glad you love the embroidery."
          },
          {
            "name": "Srishti N.",
            "city": "Karnal",
            "date": "2026-10-15",
            "rating": 5,
            "title": null,
            "text": "I got the ivory one for a day wedding. The bangle handle makes it easy to carry with bangles on.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Lavanya R.",
            "city": "Mumbai",
            "date": "2026-10-22",
            "rating": 5,
            "title": null,
            "text": "I ordered two in different colours as gifts for my bridesmaids. They were thrilled.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Fatima Z.",
            "city": "Mumbai",
            "date": "2026-10-27",
            "rating": 5,
            "title": null,
            "text": "It arrived safely and very well packed. Such a lovely little conversation piece.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Esha K.",
            "city": "Ludhiana",
            "date": "2026-10-28",
            "rating": 5,
            "title": null,
            "text": "My second Vantara piece after the bee studs, and the deer are my favourite.",
            "verified": true,
            "reply": null
          }
        ]
      }
    },
    {
      "id": "vantara-gaj-sindoor-box",
      "name": "Vantara Gaj Sindoor Box",
      "shortName": "Gaj",
      "meaning": "elephant",
      "category": "decor",
      "collections": [
        "decor",
        "vantara",
        "gifting"
      ],
      "occasions": [
        "bridal",
        "gifting",
        "home"
      ],
      "tones": [
        "gold",
        "red"
      ],
      "price": 12900,
      "availability": {
        "type": "made-to-order",
        "min": 3,
        "max": 3,
        "unit": "weeks",
        "time": "3\u00a0weeks",
        "timeShort": "3\u00a0wks"
      },
      "tag": null,
      "stockLimit": null,
      "addedOn": "2026-08-21",
      "caption": "Royal elephant ride",
      "hook": "A gold-plated elephant carrying a maharaja and his mahout, its howdah a sindoor box.",
      "story": "Gaj is the elephant, the bringer of luck at every Indian wedding. Ours carries a maharaja on a high-backed seat and a mahout at the neck, cast in brass and gold-plated, with red stones along the saddle cloth. Lift the howdah and it opens onto a small well for sindoor.",
      "wearLabel": "Use it for",
      "wearWith": "Sindoor for a bride, rings at a roka, or a keepsake on a dresser.",
      "inTheSet": [],
      "details": [
        [
          "Material",
          "Cast brass with gold plating"
        ],
        [
          "Stones",
          "Red glass"
        ],
        [
          "Opening",
          "Hinged howdah lid"
        ],
        [
          "Size",
          "About 10\u00a0×\u00a010\u00a0cm (4\u00a0×\u00a04\u00a0in)"
        ],
        [
          "Weight",
          "320–360\u00a0g"
        ]
      ],
      "code": "PJ-DC-0031",
      "specs": [
        [
          "Material",
          "Cast brass with gold plating"
        ],
        [
          "Stones",
          "Red glass along the saddle cloth"
        ],
        [
          "Finish",
          "Bright gold plating with hand-chased detail"
        ],
        [
          "Size",
          "About 10\u00a0cm (4\u00a0in) long, 5\u00a0cm (2\u00a0in) wide and 10\u00a0cm (4\u00a0in) tall"
        ],
        [
          "Weight",
          "320–360\u00a0g"
        ],
        [
          "Opening",
          "Hinged howdah lid over a small sindoor well"
        ],
        [
          "Lining",
          "None; the well is gilded"
        ],
        [
          "Use",
          "Sindoor, rings or a small keepsake"
        ]
      ],
      "care": "decor",
      "images": [
        {
          "n": 1,
          "file": "vantara-gaj-sindoor-box-01-still-life",
          "kind": "still-life",
          "role": "card",
          "colour": null,
          "widths": [
            160,
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 0.875,
          "focal": "50% 50%",
          "alt": "Gold-plated elephant sindoor box carrying a maharaja and his mahout, on ivory silk."
        },
        {
          "n": 2,
          "file": "vantara-gaj-sindoor-box-02-angle",
          "kind": "angle",
          "role": "hover",
          "colour": null,
          "widths": [
            320,
            480,
            800,
            1200
          ],
          "ratio": 0.667,
          "focal": "50% 40%",
          "alt": "The elephant from the front, trunk raised, the maharaja on his high-backed seat."
        },
        {
          "n": 3,
          "file": "vantara-gaj-sindoor-box-03-detail",
          "kind": "detail",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 0.875,
          "focal": "50% 50%",
          "alt": "Close-up of the open howdah, its border of red stones and the mahout."
        },
        {
          "n": 4,
          "file": "vantara-gaj-sindoor-box-04-angle",
          "kind": "angle",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 0.875,
          "focal": "50% 50%",
          "alt": "The whole box from the side, the howdah lid open on its hinge."
        }
      ],
      "colours": [],
      "completeTheLook": [
        "shahi-panna-polki-bridal-set"
      ],
      "related": [
        "shikhar-temple-sindoor-box",
        "vantara-hiran-nano-bag",
        "vantara-bhanwra-bee-studs"
      ],
      "reviews": {
        "average": 4.7,
        "count": 3,
        "items": [
          {
            "name": "Mansi G.",
            "city": "Karnal",
            "date": "2026-09-21",
            "rating": 5,
            "title": "A beautiful shagun gift",
            "text": "I gifted it at my cousin’s roka with sindoor inside. Everyone wanted a closer look at the little maharaja on top.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Charu V.",
            "city": "Delhi",
            "date": "2026-10-07",
            "rating": 4,
            "title": null,
            "text": "Lovely detailing and a solid weight. It took the full three weeks, so order early if it is for a date.",
            "verified": true,
            "reply": "Thank you, Charu. For wedding dates we can often finish a few days sooner; just tell us the date when you order."
          },
          {
            "name": "Prachi S.",
            "city": "Jaipur",
            "date": "2026-10-26",
            "rating": 5,
            "title": null,
            "text": "The howdah opens so smoothly. It now sits on my dressing table with my rings inside.",
            "verified": true,
            "reply": null
          }
        ]
      }
    },
    {
      "id": "shikhar-temple-sindoor-box",
      "name": "Shikhar Temple Sindoor Box",
      "shortName": "Shikhar",
      "meaning": "a temple’s spire",
      "category": "decor",
      "collections": [
        "decor",
        "bridal-edit",
        "gifting",
        "ready-to-ship"
      ],
      "occasions": [
        "bridal",
        "gifting",
        "home"
      ],
      "tones": [
        "gold",
        "red"
      ],
      "price": 14600,
      "availability": {
        "type": "ready",
        "dispatchHours": 48
      },
      "tag": null,
      "stockLimit": null,
      "addedOn": "2026-08-21",
      "caption": "Gilded temple spires",
      "hook": "A gold-plated box crowned with temple spires, opening onto a gilded inside.",
      "story": "Shikhar is a temple’s spire, and a row of them rises along this lid around a small winged Garuda. Carved niches run around the base, and ruby-red stones catch the light between them. Inside, it is gilded all over: a place for sindoor, rings or a wedding keepsake.",
      "wearLabel": "Use it for",
      "wearWith": "Sindoor on the wedding day, then her rings and keepsakes on the dresser.",
      "inTheSet": [],
      "details": [
        [
          "Material",
          "Brass with gold plating"
        ],
        [
          "Stones",
          "Ruby-red glass"
        ],
        [
          "Opening",
          "Hinged lid"
        ],
        [
          "Size",
          "11.5\u00a0×\u00a05\u00a0cm (4.5\u00a0×\u00a02\u00a0in) at the base"
        ],
        [
          "Weight",
          "260–290\u00a0g"
        ]
      ],
      "code": "PJ-DC-0024",
      "specs": [
        [
          "Material",
          "Brass with gold plating"
        ],
        [
          "Stones",
          "Ruby-red glass between carved niches"
        ],
        [
          "Finish",
          "Bright gold plating with antique-toned recesses"
        ],
        [
          "Size",
          "11.5\u00a0×\u00a05\u00a0cm (4.5\u00a0×\u00a02\u00a0in) at the base, 7\u00a0cm (2.8\u00a0in) tall to the spires"
        ],
        [
          "Weight",
          "260–290\u00a0g"
        ],
        [
          "Opening",
          "Hinged lid, crowned with temple spires and a small winged Garuda"
        ],
        [
          "Lining",
          "None; gilded all over inside"
        ],
        [
          "Use",
          "Sindoor, rings or wedding keepsakes"
        ]
      ],
      "care": "decor",
      "images": [
        {
          "n": 1,
          "file": "shikhar-temple-sindoor-box-01-still-life",
          "kind": "still-life",
          "role": "card",
          "colour": null,
          "widths": [
            160,
            320,
            480,
            800,
            1200,
            1600
          ],
          "ratio": 0.875,
          "focal": "50% 50%",
          "alt": "Gold-plated temple box with spires and red stones, on ivory silk."
        },
        {
          "n": 2,
          "file": "shikhar-temple-sindoor-box-02-angle",
          "kind": "angle",
          "role": "hover",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 0.875,
          "focal": "50% 50%",
          "alt": "The lid open, showing the gilded inside."
        },
        {
          "n": 3,
          "file": "shikhar-temple-sindoor-box-03-angle",
          "kind": "angle",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200,
            1600
          ],
          "ratio": 0.875,
          "focal": "50% 50%",
          "alt": "The open box from the front."
        },
        {
          "n": 4,
          "file": "shikhar-temple-sindoor-box-04-detail",
          "kind": "detail",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200
          ],
          "ratio": 0.668,
          "focal": "50% 40%",
          "alt": "Close-up of the temple spires and the small winged Garuda on the lid."
        },
        {
          "n": 5,
          "file": "shikhar-temple-sindoor-box-05-detail",
          "kind": "detail",
          "role": "gallery",
          "colour": null,
          "widths": [
            480,
            800,
            1200
          ],
          "ratio": 0.667,
          "focal": "50% 50%",
          "alt": "Close-up of the inside of the lid."
        }
      ],
      "colours": [],
      "completeTheLook": [
        "shahi-panna-polki-bridal-set",
        "mehfil-jadau-potli"
      ],
      "related": [
        "vantara-gaj-sindoor-box",
        "mehtab-pearl-chandbalis",
        "sheesh-mahal-polki-bag"
      ],
      "reviews": {
        "average": 4.8,
        "count": 6,
        "items": [
          {
            "name": "Kamya J.",
            "city": "Panipat",
            "date": "2026-09-02",
            "rating": 5,
            "title": "For my sister, the bride",
            "text": "I bought it for her sindoor ceremony. The gilded inside is so pretty when you open it.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Neelam A.",
            "city": "Karnal",
            "date": "2026-09-14",
            "rating": 5,
            "title": null,
            "text": "The spires and the little Garuda are finely made. It feels like a family piece already.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Ritu B.",
            "city": "Gurugram",
            "date": "2026-09-29",
            "rating": 5,
            "title": null,
            "text": "It arrived in two days, packed in the red box with a note. A perfect wedding gift.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Swati M.",
            "city": "Delhi",
            "date": "2026-10-12",
            "rating": 4,
            "title": null,
            "text": "Beautiful work. The lid is a little stiff at first but eases with use.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Ankita D.",
            "city": "Chandigarh",
            "date": "2026-10-23",
            "rating": 5,
            "title": null,
            "text": "I ordered it as a gift for my mother’s anniversary. She keeps her rings in it now.",
            "verified": true,
            "reply": null
          },
          {
            "name": "Sneha K.",
            "city": "Ludhiana",
            "date": "2026-10-30",
            "rating": 5,
            "title": null,
            "text": "Bought it for a friend’s wedding. Beautiful craftsmanship, and it came very well packed.",
            "verified": true,
            "reply": null
          }
        ]
      }
    }
  ]
};
