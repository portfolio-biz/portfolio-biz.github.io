/* eslint-disable */
const DB = {
    cpu: {
        label: 'ЦП — Процессор',
        short: 'ЦП',
        items: [
            {
                id: 'r5-9600x', brand: 'AMD', name: 'Ryzen 5 9600X',
                price: 27900, socket: 'AM5', tdp: 65,
                specs: { 'Ядра/Потоки': '6/12', 'Турбо': '5.4 ГГц', 'Кэш L3': '32 МБ', 'TDP': '65 Вт', 'Сокет': 'AM5' },
                badge: null
            },
            {
                id: 'r7-9700x', brand: 'AMD', name: 'Ryzen 7 9700X',
                price: 35900, socket: 'AM5', tdp: 65,
                specs: { 'Ядра/Потоки': '8/16', 'Турбо': '5.5 ГГц', 'Кэш L3': '32 МБ', 'TDP': '65 Вт', 'Сокет': 'AM5' },
                badge: null
            },
            {
                id: 'r7-9800x3d', brand: 'AMD', name: 'Ryzen 7 9800X3D',
                price: 48500, socket: 'AM5', tdp: 120,
                specs: { 'Ядра/Потоки': '8/16', 'Турбо': '5.2 ГГц', 'Кэш L3': '96 МБ 3D V-Cache', 'TDP': '120 Вт', 'Сокет': 'AM5' },
                badge: 'ТОПОВЫЙ В ИГРАХ'
            },
            {
                id: 'r9-9950x', brand: 'AMD', name: 'Ryzen 9 9950X',
                price: 64900, socket: 'AM5', tdp: 170,
                specs: { 'Ядра/Потоки': '16/32', 'Турбо': '5.7 ГГц', 'Кэш L3': '64 МБ', 'TDP': '170 Вт', 'Сокет': 'AM5' },
                badge: 'ФЛАГМАН AMD'
            },
            {
                id: 'r9-9950x3d', brand: 'AMD', name: 'Ryzen 9 9950X3D',
                price: 84900, socket: 'AM5', tdp: 170,
                specs: { 'Ядра/Потоки': '16/32', 'Турбо': '5.7 ГГц', 'Кэш L3': '128 МБ 3D V-Cache', 'TDP': '170 Вт', 'Сокет': 'AM5' },
                badge: 'ULTIMATE'
            },
            {
                id: 'cu5-245k', brand: 'Intel', name: 'Core Ultra 5 245K',
                price: 31900, socket: 'LGA1851', tdp: 125,
                specs: { 'Ядра/Потоки': '14/14', 'Турбо': '5.2 ГГц', 'Кэш L3': '24 МБ', 'TDP': '125 Вт', 'Сокет': 'LGA1851' },
                badge: null
            },
            {
                id: 'cu7-265k', brand: 'Intel', name: 'Core Ultra 7 265K',
                price: 39900, socket: 'LGA1851', tdp: 125,
                specs: { 'Ядра/Потоки': '20/20', 'Турбо': '5.5 ГГц', 'Кэш L3': '30 МБ', 'TDP': '125 Вт', 'Сокет': 'LGA1851' },
                badge: null
            },
            {
                id: 'cu9-285k', brand: 'Intel', name: 'Core Ultra 9 285K',
                price: 58900, socket: 'LGA1851', tdp: 125,
                specs: { 'Ядра/Потоки': '24/24', 'Турбо': '5.7 ГГц', 'Кэш L3': '36 МБ', 'TDP': '125 Вт', 'Сокет': 'LGA1851' },
                badge: 'ФЛАГМАН INTEL'
            },
            {
                id: 'r5-9600', brand: 'AMD', name: 'Ryzen 5 9600',
                price: 22500, socket: 'AM5', tdp: 65,
                specs: { 'Ядра/Потоки': '6/12', 'Турбо': '5.1 ГГц', 'Кэш L3': '32 МБ', 'TDP': '65 Вт', 'Сокет': 'AM5' },
                badge: null
            },
            {
                id: 'cu5-225', brand: 'Intel', name: 'Core Ultra 5 225',
                price: 18500, socket: 'LGA1851', tdp: 65,
                specs: { 'Ядра/Потоки': '14/14', 'Турбо': '4.9 ГГц', 'Кэш L3': '24 МБ', 'TDP': '65 Вт', 'Сокет': 'LGA1851' },
                badge: null
            },
            {
                id: 'cu7-255', brand: 'Intel', name: 'Core Ultra 7 255',
                price: 28500, socket: 'LGA1851', tdp: 65,
                specs: { 'Ядра/Потоки': '20/20', 'Турбо': '5.1 ГГц', 'Кэш L3': '30 МБ', 'TDP': '65 Вт', 'Сокет': 'LGA1851' },
                badge: null
            }
        ]
    },

    gpu: {
        label: 'GPU — Видеокарта',
        short: 'GPU',
        items: [
            {
                id: 'rtx-5060', brand: 'NVIDIA', name: 'GeForce RTX 5060',
                price: 32900, tdp: 150,
                specs: { 'Архитектура': 'Blackwell', 'VRAM': '8 ГБ GDDR7', 'TDP': '150 Вт', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'rtx-5060ti', brand: 'NVIDIA', name: 'GeForce RTX 5060 Ti',
                price: 44900, tdp: 180,
                specs: { 'Архитектура': 'Blackwell', 'VRAM': '16 ГБ GDDR7', 'TDP': '180 Вт', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'rtx-5070', brand: 'NVIDIA', name: 'GeForce RTX 5070',
                price: 57900, tdp: 250,
                specs: { 'Архитектура': 'Blackwell', 'VRAM': '12 ГБ GDDR7', 'TDP': '250 Вт', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'rtx-5070ti', brand: 'NVIDIA', name: 'GeForce RTX 5070 Ti',
                price: 78900, tdp: 300,
                specs: { 'Архитектура': 'Blackwell', 'VRAM': '16 ГБ GDDR7', 'TDP': '300 Вт', 'PCIe': '5.0 x16' },
                badge: 'ЛУЧШИЙ ВЫБОР'
            },
            {
                id: 'rtx-5080', brand: 'NVIDIA', name: 'GeForce RTX 5080',
                price: 104900, tdp: 360,
                specs: { 'Архитектура': 'Blackwell', 'VRAM': '16 ГБ GDDR7', 'TDP': '360 Вт', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'rtx-5090', brand: 'NVIDIA', name: 'GeForce RTX 5090',
                price: 219900, tdp: 575,
                specs: { 'Архитектура': 'Blackwell', 'VRAM': '32 ГБ GDDR7', 'TDP': '575 Вт', 'PCIe': '5.0 x16' },
                badge: 'АБСОЛЮТНЫЙ ТОП'
            },
            {
                id: 'rx-9060xt', brand: 'AMD', name: 'Radeon RX 9060 XT',
                price: 36900, tdp: 160,
                specs: { 'Архитектура': 'RDNA 4', 'VRAM': '16 ГБ GDDR6', 'TDP': '160 Вт', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'rx-9070xt', brand: 'AMD', name: 'Radeon RX 9070 XT',
                price: 63900, tdp: 250,
                specs: { 'Архитектура': 'RDNA 4', 'VRAM': '16 ГБ GDDR6', 'TDP': '250 Вт', 'PCIe': '5.0 x16' },
                badge: 'ОТЛИЧНЫЙ AMD'
            },
            {
                id: 'rx-9080', brand: 'AMD', name: 'Radeon RX 9080',
                price: 78900, tdp: 300,
                specs: { 'Архитектура': 'RDNA 4', 'VRAM': '32 ГБ GDDR6', 'TDP': '300 Вт', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'arc-b580', brand: 'Intel', name: 'Arc B580',
                price: 25900, tdp: 190,
                specs: { 'Архитектура': 'Battlemage', 'VRAM': '12 ГБ GDDR6', 'TDP': '190 Вт', 'PCIe': '5.0 x8' },
                badge: null
            },
            {
                id: 'arc-b770', brand: 'Intel', name: 'Arc B770',
                price: 38900, tdp: 230,
                specs: { 'Архитектура': 'Battlemage', 'VRAM': '16 ГБ GDDR6', 'TDP': '230 Вт', 'PCIe': '5.0 x8' },
                badge: null
            },
            {
                id: 'rtx-5070s', brand: 'NVIDIA', name: 'GeForce RTX 5070 Super',
                price: 68900, tdp: 270,
                specs: { 'Архитектура': 'Blackwell', 'VRAM': '16 ГБ GDDR7', 'TDP': '270 Вт', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'rtx-5080ti', brand: 'NVIDIA', name: 'GeForce RTX 5080 Ti',
                price: 139900, tdp: 420,
                specs: { 'Архитектура': 'Blackwell', 'VRAM': '24 ГБ GDDR7', 'TDP': '420 Вт', 'PCIe': '5.0 x16' },
                badge: 'ТОП MID-HIGH'
            }
        ]
    },

    mb: {
        label: 'Материнская плата',
        short: 'МП',
        items: [
            {
                id: 'asus-prime-b650', brand: 'ASUS', name: 'PRIME B650-A WiFi',
                price: 19900, socket: 'AM5', form: 'ATX', chipset: 'B650',
                specs: { 'Сокет': 'AM5', 'Чипсет': 'B650', 'Форм-фактор': 'ATX', 'RAM': '4× DDR5-6400+', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'msi-b650-tomahawk', brand: 'MSI', name: 'MAG B650 Tomahawk WiFi',
                price: 22900, socket: 'AM5', form: 'ATX', chipset: 'B650',
                specs: { 'Сокет': 'AM5', 'Чипсет': 'B650', 'Форм-фактор': 'ATX', 'RAM': '4× DDR5-7200+', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'asus-x670e-hero', brand: 'ASUS', name: 'ROG Crosshair X670E Hero',
                price: 51900, socket: 'AM5', form: 'ATX', chipset: 'X670E',
                specs: { 'Сокет': 'AM5', 'Чипсет': 'X670E', 'Форм-фактор': 'ATX', 'RAM': '4× DDR5-8000+ OC', 'PCIe': '5.0 x16 × 2' },
                badge: 'ТОПОВЫЙ AM5'
            },
            {
                id: 'asus-x870e-hero', brand: 'ASUS', name: 'ROG Crosshair X870E Hero',
                price: 64900, socket: 'AM5', form: 'ATX', chipset: 'X870E',
                specs: { 'Сокет': 'AM5', 'Чипсет': 'X870E', 'Форм-фактор': 'ATX', 'RAM': '4× DDR5-8000+ OC', 'Thunderbolt': '5' },
                badge: 'X870E ФЛАГМАН'
            },
            {
                id: 'asus-prime-z890', brand: 'ASUS', name: 'PRIME Z890-A WiFi',
                price: 24900, socket: 'LGA1851', form: 'ATX', chipset: 'Z890',
                specs: { 'Сокет': 'LGA1851', 'Чипсет': 'Z890', 'Форм-фактор': 'ATX', 'RAM': '4× DDR5-8000+', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'msi-z890-tomahawk', brand: 'MSI', name: 'MAG Z890 Tomahawk WiFi',
                price: 28900, socket: 'LGA1851', form: 'ATX', chipset: 'Z890',
                specs: { 'Сокет': 'LGA1851', 'Чипсет': 'Z890', 'Форм-фактор': 'ATX', 'RAM': '4× DDR5-9200+ OC', 'Thunderbolt': '4' },
                badge: null
            },
            {
                id: 'asus-rog-maximus-z890', brand: 'ASUS', name: 'ROG Maximus Z890 Apex',
                price: 64900, socket: 'LGA1851', form: 'ATX', chipset: 'Z890',
                specs: { 'Сокет': 'LGA1851', 'Чипсет': 'Z890', 'Форм-фактор': 'ATX', 'RAM': '2× DDR5-10400+ OC', 'Thunderbolt': '5' },
                badge: 'Z890 ФЛАГМАН'
            },
            {
                id: 'msi-b650m-mortar', brand: 'MSI', name: 'MAG B650M Mortar WiFi',
                price: 16500, socket: 'AM5', form: 'mATX', chipset: 'B650',
                specs: { 'Сокет': 'AM5', 'Чипсет': 'B650', 'Форм-фактор': 'mATX', 'RAM': '4× DDR5-7200+', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'gb-b650-aorus-elite', brand: 'Gigabyte', name: 'B650 Aorus Elite AX',
                price: 21900, socket: 'AM5', form: 'ATX', chipset: 'B650',
                specs: { 'Сокет': 'AM5', 'Чипсет': 'B650', 'Форм-фактор': 'ATX', 'RAM': '4× DDR5-8000+ OC', 'PCIe': '5.0 x16' },
                badge: null
            },
            {
                id: 'gb-z890-aorus-master', brand: 'Gigabyte', name: 'Z890 Aorus Master',
                price: 49900, socket: 'LGA1851', form: 'ATX', chipset: 'Z890',
                specs: { 'Сокет': 'LGA1851', 'Чипсет': 'Z890', 'Форм-фактор': 'ATX', 'RAM': '4× DDR5-9600+ OC', 'Thunderbolt': '5' },
                badge: null
            },
            {
                id: 'asus-rog-strix-b850f', brand: 'ASUS', name: 'ROG Strix B850-F Gaming WiFi',
                price: 31900, socket: 'LGA1851', form: 'ATX', chipset: 'B850',
                specs: { 'Сокет': 'LGA1851', 'Чипсет': 'B850', 'Форм-фактор': 'ATX', 'RAM': '4× DDR5-8000+ OC', 'Thunderbolt': '4' },
                badge: null
            }
        ]
    },

    ram: {
        label: 'Оперативная память',
        short: 'RAM',
        items: [
            {
                id: 'ddr5-16-6000', brand: 'DDR5', name: '16 ГБ DDR5-6000 (1×16)',
                price: 6500,
                specs: { 'Объём': '16 ГБ', 'Частота': 'DDR5-6000', 'Тайминги': 'CL36', 'Профиль': 'XMP 3.0 / EXPO' },
                badge: null
            },
            {
                id: 'ddr5-32-6000', brand: 'DDR5', name: '32 ГБ DDR5-6000 (2×16)',
                price: 10900,
                specs: { 'Объём': '32 ГБ', 'Частота': 'DDR5-6000', 'Тайминги': 'CL36', 'Режим': 'Dual Channel' },
                badge: 'ОПТИМАЛЬНО'
            },
            {
                id: 'ddr5-32-7200', brand: 'DDR5', name: '32 ГБ DDR5-7200 (2×16)',
                price: 13900,
                specs: { 'Объём': '32 ГБ', 'Частота': 'DDR5-7200', 'Тайминги': 'CL34', 'Режим': 'Dual Channel' },
                badge: null
            },
            {
                id: 'ddr5-64-6000', brand: 'DDR5', name: '64 ГБ DDR5-6000 (2×32)',
                price: 19900,
                specs: { 'Объём': '64 ГБ', 'Частота': 'DDR5-6000', 'Тайминги': 'CL36', 'Режим': 'Dual Channel' },
                badge: null
            },
            {
                id: 'ddr5-64-7200', brand: 'DDR5', name: '64 ГБ DDR5-7200 (2×32)',
                price: 25900,
                specs: { 'Объём': '64 ГБ', 'Частота': 'DDR5-7200', 'Тайминги': 'CL34', 'Режим': 'Dual Channel' },
                badge: null
            },
            {
                id: 'ddr5-32-8000', brand: 'DDR5', name: '32 ГБ DDR5-8000 (2×16)',
                price: 17900,
                specs: { 'Объём': '32 ГБ', 'Частота': 'DDR5-8000', 'Тайминги': 'CL38', 'Режим': 'Dual Ch. OC' },
                badge: null
            },
            {
                id: 'ddr5-96-6400', brand: 'DDR5', name: '96 ГБ DDR5-6400 (2×48)',
                price: 33900,
                specs: { 'Объём': '96 ГБ', 'Частота': 'DDR5-6400', 'Тайминги': 'CL32', 'Режим': 'Dual Channel' },
                badge: null
            },
            {
                id: 'ddr5-128-6000', brand: 'DDR5', name: '128 ГБ DDR5-6000 (2×64)',
                price: 43900,
                specs: { 'Объём': '128 ГБ', 'Частота': 'DDR5-6000', 'Тайминги': 'CL36', 'Режим': 'Dual Channel' },
                badge: null
            }
        ]
    },

    storage: {
        label: 'Накопитель NVMe',
        short: 'SSD',
        items: [
            {
                id: 'ssd-1tb-4', brand: 'NVMe', name: '1 ТБ NVMe PCIe 4.0',
                price: 7900,
                specs: { 'Объём': '1 ТБ', 'Интерфейс': 'M.2 PCIe 4.0', 'Чтение': '7 400 МБ/с', 'Запись': '6 800 МБ/с' },
                badge: null
            },
            {
                id: 'ssd-2tb-4', brand: 'NVMe', name: '2 ТБ NVMe PCIe 4.0',
                price: 12900,
                specs: { 'Объём': '2 ТБ', 'Интерфейс': 'M.2 PCIe 4.0', 'Чтение': '7 400 МБ/с', 'Запись': '6 900 МБ/с' },
                badge: 'ПОПУЛЯРНЫЙ'
            },
            {
                id: 'ssd-1tb-5', brand: 'NVMe', name: '1 ТБ NVMe PCIe 5.0',
                price: 14900,
                specs: { 'Объём': '1 ТБ', 'Интерфейс': 'M.2 PCIe 5.0', 'Чтение': '12 400 МБ/с', 'Запись': '11 200 МБ/с' },
                badge: null
            },
            {
                id: 'ssd-2tb-5', brand: 'NVMe', name: '2 ТБ NVMe PCIe 5.0',
                price: 23900,
                specs: { 'Объём': '2 ТБ', 'Интерфейс': 'M.2 PCIe 5.0', 'Чтение': '14 000 МБ/с', 'Запись': '12 000 МБ/с' },
                badge: null
            },
            {
                id: 'ssd-4tb-5', brand: 'NVMe', name: '4 ТБ NVMe PCIe 5.0',
                price: 38900,
                specs: { 'Объём': '4 ТБ', 'Интерфейс': 'M.2 PCIe 5.0', 'Чтение': '14 500 МБ/с', 'Запись': '13 500 МБ/с' },
                badge: null
            },
            {
                id: 'ssd-samsung-990pro-2tb', brand: 'Samsung', name: '990 Pro 2 ТБ PCIe 4.0',
                price: 14500,
                specs: { 'Объём': '2 ТБ', 'Интерфейс': 'M.2 PCIe 4.0', 'Чтение': '7 450 МБ/с', 'Запись': '6 900 МБ/с' },
                badge: 'НАДЁЖНЫЙ'
            },
            {
                id: 'ssd-wd-sn850x-4tb', brand: 'WD', name: 'Black SN850X 4 ТБ PCIe 4.0',
                price: 31900,
                specs: { 'Объём': '4 ТБ', 'Интерфейс': 'M.2 PCIe 4.0', 'Чтение': '7 300 МБ/с', 'Запись': '6 600 МБ/с' },
                badge: null
            },
            {
                id: 'ssd-crucial-t705-2tb', brand: 'Crucial', name: 'T705 2 ТБ PCIe 5.0',
                price: 21900,
                specs: { 'Объём': '2 ТБ', 'Интерфейс': 'M.2 PCIe 5.0', 'Чтение': '13 600 МБ/с', 'Запись': '10 200 МБ/с' },
                badge: null
            },
            {
                id: 'ssd-kingston-kc3000-4tb', brand: 'Kingston', name: 'KC3000 4 ТБ PCIe 4.0',
                price: 27900,
                specs: { 'Объём': '4 ТБ', 'Интерфейс': 'M.2 PCIe 4.0', 'Чтение': '7 000 МБ/с', 'Запись': '7 000 МБ/с' },
                badge: null
            }
        ]
    },

    cooling: {
        label: 'Охлаждение ЦП',
        short: 'Кулер',
        items: [
            {
                id: 'air-120', brand: 'Air', name: 'Башня 120 Вт (Thermalright Assassin X 120)',
                price: 3500, maxTdp: 120, type: 'air',
                specs: { 'Тип': 'Воздушный', 'Макс. TDP': '120 Вт', 'Вентилятор': '120 мм', 'Шум': '≤28 дБА' },
                badge: null
            },
            {
                id: 'air-180', brand: 'Air', name: 'Башня 180 Вт (Thermalright PA120 SE)',
                price: 6500, maxTdp: 180, type: 'air',
                specs: { 'Тип': 'Воздушный двойной', 'Макс. TDP': '180 Вт', 'Вентиляторы': '2×120 мм', 'Шум': '≤25 дБА' },
                badge: 'ЛУЧШЕЕ ЗА ДЕНЬГИ'
            },
            {
                id: 'aio-240', brand: 'AIO', name: 'СЖО 240 мм (ASUS ROG Strix LC II)',
                price: 10500, maxTdp: 200, type: 'aio',
                specs: { 'Тип': 'СЖО', 'Радиатор': '240 мм', 'Вентиляторы': '2×120 мм ARGB', 'Макс. TDP': '200 Вт' },
                badge: null
            },
            {
                id: 'aio-360', brand: 'AIO', name: 'СЖО 360 мм (NZXT Kraken Elite 360)',
                price: 16500, maxTdp: 300, type: 'aio',
                specs: { 'Тип': 'СЖО', 'Радиатор': '360 мм', 'Вентиляторы': '3×120 мм ARGB', 'Макс. TDP': '300 Вт' },
                badge: null
            },
            {
                id: 'aio-420', brand: 'AIO', name: 'СЖО 420 мм (be quiet! Silent Loop 3)',
                price: 23000, maxTdp: 400, type: 'aio',
                specs: { 'Тип': 'СЖО', 'Радиатор': '420 мм', 'Вентиляторы': '3×140 мм', 'Макс. TDP': '400 Вт' },
                badge: null
            },
            {
                id: 'noctua-nhd15-g2', brand: 'Noctua', name: 'NH-D15 G2',
                price: 9500, maxTdp: 250, type: 'air',
                specs: { 'Тип': 'Воздушный двойной', 'Макс. TDP': '250 Вт', 'Вентиляторы': '2×150 мм', 'Шум': '≤24 дБА' },
                badge: 'ЛУЧШИЙ AIR'
            },
            {
                id: 'bq-dark-rock-pro5', brand: 'be quiet!', name: 'Dark Rock Pro 5',
                price: 7900, maxTdp: 250, type: 'air',
                specs: { 'Тип': 'Воздушный двойной', 'Макс. TDP': '250 Вт', 'Вентиляторы': '2×135 мм', 'Шум': '≤21 дБА' },
                badge: null
            },
            {
                id: 'arctic-freezer36', brand: 'Arctic', name: 'Freezer 36 CO',
                price: 5500, maxTdp: 200, type: 'air',
                specs: { 'Тип': 'Башня', 'Макс. TDP': '200 Вт', 'Вентиляторы': '2×120 мм', 'Шум': '≤26 дБА' },
                badge: null
            },
            {
                id: 'aio-360-lc-nzxt-x73', brand: 'AIO', name: 'СЖО 360 мм (NZXT Kraken X73)',
                price: 14900, maxTdp: 300, type: 'aio',
                specs: { 'Тип': 'СЖО', 'Радиатор': '360 мм', 'Вентиляторы': '3×120 мм', 'Макс. TDP': '300 Вт' },
                badge: null
            }
        ]
    },

    psu: {
        label: 'Блок питания',
        short: 'БП',
        items: [
            {
                id: 'psu-650', brand: '80+ Gold', name: '650 Вт Gold (Seasonic Focus GX-650)',
                price: 9900, wattage: 650,
                specs: { 'Мощность': '650 Вт', 'Сертификат': '80+ Gold', 'Тип': 'Fully Modular', 'Гарантия': '10 лет' },
                badge: null
            },
            {
                id: 'psu-750', brand: '80+ Gold', name: '750 Вт Gold (Corsair RM750x)',
                price: 12500, wattage: 750,
                specs: { 'Мощность': '750 Вт', 'Сертификат': '80+ Gold', 'Тип': 'Fully Modular', 'Гарантия': '10 лет' },
                badge: null
            },
            {
                id: 'psu-850', brand: '80+ Gold', name: '850 Вт Gold (be quiet! SP12)',
                price: 14900, wattage: 850,
                specs: { 'Мощность': '850 Вт', 'Сертификат': '80+ Gold', 'Тип': 'Fully Modular', 'Гарантия': '10 лет' },
                badge: 'ПОПУЛЯРНЫЙ'
            },
            {
                id: 'psu-1000', brand: '80+ Gold', name: '1000 Вт Gold (Seasonic Prime GX-1000)',
                price: 18500, wattage: 1000,
                specs: { 'Мощность': '1000 Вт', 'Сертификат': '80+ Gold', 'Тип': 'Fully Modular', 'Гарантия': '12 лет' },
                badge: null
            },
            {
                id: 'psu-1200', brand: '80+ Platinum', name: '1200 Вт Platinum (ASUS ROG THOR 1200P2)',
                price: 23900, wattage: 1200,
                specs: { 'Мощность': '1200 Вт', 'Сертификат': '80+ Platinum', 'Тип': 'Fully Modular', 'OLED': 'Монитор мощности' },
                badge: null
            },
            {
                id: 'psu-850-titanium', brand: '80+ Titanium', name: '850 Вт Titanium (Seasonic Prime TX-850)',
                price: 19900, wattage: 850,
                specs: { 'Мощность': '850 Вт', 'Сертификат': '80+ Titanium', 'Тип': 'Fully Modular', 'Гарантия': '12 лет' },
                badge: null
            },
            {
                id: 'psu-1000-sfx', brand: '80+ Platinum', name: '1000 Вт Platinum SFX-L (ASUS ROG LOKI)',
                price: 22900, wattage: 1000,
                specs: { 'Мощность': '1000 Вт', 'Сертификат': '80+ Platinum', 'Тип': 'SFX-L Modular', 'Компактность': 'Мини-формат' },
                badge: null
            },
            {
                id: 'psu-1600-titanium', brand: '80+ Titanium', name: '1600 Вт Titanium (Super Flower Leadex Ti)',
                price: 36900, wattage: 1600,
                specs: { 'Мощность': '1600 Вт', 'Сертификат': '80+ Titanium', 'Тип': 'Fully Modular', 'Гарантия': '10 лет' },
                badge: null
            }
        ]
    },

    case: {
        label: 'Корпус',
        short: 'Корпус',
        items: [
            {
                id: 'cm-td500', brand: 'Cooler Master', name: 'MasterBox TD500 Mesh V2',
                price: 9500, supports: ['ATX', 'mATX', 'ITX'],
                specs: { 'Тип': 'Mid Tower', 'Форм-фактор': 'ATX/mATX/ITX', 'Вентиляторы': '3×120мм ARGB', 'Макс. СЖО': '360 мм' },
                badge: null
            },
            {
                id: 'fractal-north', brand: 'Fractal Design', name: 'North Mid Tower',
                price: 12500, supports: ['ATX', 'mATX', 'ITX'],
                specs: { 'Тип': 'Mid Tower', 'Форм-фактор': 'ATX/mATX/ITX', 'Дизайн': 'Деревянная панель', 'Макс. СЖО': '360 мм' },
                badge: null
            },
            {
                id: 'nzxt-h7-flow', brand: 'NZXT', name: 'H7 Flow Mid Tower',
                price: 14900, supports: ['ATX', 'mATX', 'ITX'],
                specs: { 'Тип': 'Mid Tower', 'Форм-фактор': 'ATX/mATX/ITX', 'USB-C': '3.2 Gen 2', 'Макс. СЖО': '420 мм' },
                badge: null
            },
            {
                id: 'lian-li-o11d', brand: 'Lian Li', name: 'O11 Dynamic EVO',
                price: 16900, supports: ['ATX', 'mATX', 'ITX'],
                specs: { 'Тип': 'Mid Tower', 'Форм-фактор': 'ATX/mATX/ITX', 'Стекло': 'Двойное TG', 'Макс. СЖО': '360 мм × 3' },
                badge: 'ТОП ДИЗАЙН'
            },
            {
                id: 'bq-silent-802', brand: 'be quiet!', name: 'Silent Base 802 Full Tower',
                price: 17900, supports: ['E-ATX', 'ATX', 'mATX', 'ITX'],
                specs: { 'Тип': 'Full Tower', 'Форм-фактор': 'E-ATX/ATX/mATX/ITX', 'Шумоизоляция': 'Да', 'Макс. СЖО': '420 мм' },
                badge: null
            },
            {
                id: 'fractal-torrent-compact', brand: 'Fractal Design', name: 'Torrent Compact',
                price: 11500, supports: ['ATX', 'mATX', 'ITX'],
                specs: { 'Тип': 'Mid Tower', 'Форм-фактор': 'ATX/mATX/ITX', 'Вентиляторы': '2×180 мм фронт', 'Макс. СЖО': '360 мм' },
                badge: 'ТОП ВОЗДУХ'
            },
            {
                id: 'phanteks-p500a', brand: 'Phanteks', name: 'Eclipse P500A D-RGB',
                price: 13900, supports: ['E-ATX', 'ATX', 'mATX', 'ITX'],
                specs: { 'Тип': 'Mid Tower', 'Форм-фактор': 'E-ATX/ATX/mATX', 'Вентиляторы': '3×140 мм D-RGB', 'Макс. СЖО': '420 мм' },
                badge: null
            },
            {
                id: 'corsair-4000d', brand: 'Corsair', name: '4000D Airflow',
                price: 10900, supports: ['ATX', 'mATX', 'ITX'],
                specs: { 'Тип': 'Mid Tower', 'Форм-фактор': 'ATX/mATX/ITX', 'Вентиляторы': '2×120 мм', 'Макс. СЖО': '360 мм' },
                badge: null
            },
            {
                id: 'cm-haf700-evo', brand: 'Cooler Master', name: 'HAF 700 EVO Full Tower',
                price: 21900, supports: ['E-ATX', 'ATX', 'mATX', 'ITX'],
                specs: { 'Тип': 'Full Tower', 'Форм-фактор': 'E-ATX/ATX', 'Вентиляторы': '6× Addressable', 'Макс. СЖО': '420 мм × 2' },
                badge: null
            }
        ]
    }
};

