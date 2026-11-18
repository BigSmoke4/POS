using Microsoft.AspNetCore.Mvc;

namespace GlassDashboard.Controllers;

public class HomeController : Controller
{
    public IActionResult Index() => View();

    // Replace the sample data below with your database/service call.
    // Shape: [{ id: 1, name: "Dhaka", monthly: [12 BDT amounts Jan..Dec] }]
    [HttpGet]
    public IActionResult SalesData()
    {
        var branches = new[]
        {
            new { id = 1, name = "Dhaka", scale = 1.0 },
            new { id = 2, name = "Chattogram", scale = 0.72 },
            new { id = 3, name = "Barishal", scale = 0.38 },
            new { id = 4, name = "Khulna", scale = 0.50 },
            new { id = 5, name = "Sylhet", scale = 0.44 },
            new { id = 6, name = "Rajshahi", scale = 0.34 },
            new { id = 7, name = "Rangpur", scale = 0.28 },
            new { id = 8, name = "Mymensingh", scale = 0.32 }
        };

        var data = branches.Select((b, i) => new
        {
            id = b.id,
            name = b.name,
            monthly = Enumerable.Range(0, 12)
                .Select(m => Math.Round(b.scale * (2_400_000 + 900_000 * Math.Sin((m + i) * 0.7) + m * 85_000)))
                .ToArray()
        });

        return Json(data);
    }

    // Dynamic Top Products Endpoint:
    // Backend can accept optional branchId (int? or null for All Branches).
    // Returns top products for that branch or aggregate across all branches.
    [HttpGet]
    public IActionResult TopProducts(int? branchId = null)
    {
        var allProducts = new[]
        {
            // Dhaka Branch (id: 1)
            new { id = 1, branchId = 1, name = "Sony Bravia 55\" 4K Google TV", amount = 1250000, qty = 15 },
            new { id = 2, branchId = 1, name = "Samsung French Door Refrigerator 580L", amount = 980000, qty = 8 },
            new { id = 3, branchId = 1, name = "Gree 1.5 Ton Dual Inverter AC", amount = 720000, qty = 12 },
            new { id = 4, branchId = 1, name = "LG AI DD Front Load Washer 9KG", amount = 540000, qty = 9 },
            new { id = 5, branchId = 1, name = "Panasonic Inverter Microwave 32L", amount = 320000, qty = 22 },
            new { id = 6, branchId = 1, name = "Philips Digital Air Fryer XL", amount = 210000, qty = 25 },

            // Chattogram Branch (id: 2)
            new { id = 7, branchId = 2, name = "Carrier 2.0 Ton Heavy Duty AC", amount = 890000, qty = 11 },
            new { id = 8, branchId = 2, name = "Samsung 65\" Crystal UHD 4K TV", amount = 780000, qty = 9 },
            new { id = 9, branchId = 2, name = "Whirlpool Double Door Fridge 340L", amount = 490000, qty = 13 },
            new { id = 10, branchId = 2, name = "Haier Top Load Fully Auto Washer", amount = 340000, qty = 14 },
            new { id = 11, branchId = 2, name = "Hitachi Power Suction Vacuum Cleaner", amount = 195000, qty = 18 },

            // Barishal Branch (id: 3)
            new { id = 12, branchId = 3, name = "Walton Smart Inverter Refrigerator", amount = 420000, qty = 16 },
            new { id = 13, branchId = 3, name = "Singer 43\" Android Smart TV", amount = 380000, qty = 12 },
            new { id = 14, branchId = 3, name = "Midea 1.0 Ton Split Inverter AC", amount = 310000, qty = 8 },
            new { id = 15, branchId = 3, name = "Miyako Heavy Weight Blender & Grinder", amount = 165000, qty = 38 },
            new { id = 16, branchId = 3, name = "Vision Multi Induction Cooker 2200W", amount = 95000, qty = 28 },

            // Khulna Branch (id: 4)
            new { id = 17, branchId = 4, name = "Haier 1.5 Ton Clean Cool Inverter AC", amount = 560000, qty = 10 },
            new { id = 18, branchId = 4, name = "Sony 43\" 4K HDR Smart TV", amount = 470000, qty = 11 },
            new { id = 19, branchId = 4, name = "Sharp No-Frost Refrigerator 315L", amount = 390000, qty = 9 },
            new { id = 20, branchId = 4, name = "Walton Chest Freezer 250L", amount = 295000, qty = 12 },
            new { id = 21, branchId = 4, name = "Prestige Electric Pressure Cooker 6L", amount = 145000, qty = 26 },

            // Sylhet Branch (id: 5)
            new { id = 22, branchId = 5, name = "General 1.5 Ton Tropical Inverter AC", amount = 680000, qty = 9 },
            new { id = 23, branchId = 5, name = "Samsung 50\" QLED 4K Smart TV", amount = 520000, qty = 8 },
            new { id = 24, branchId = 5, name = "Hitachi Bottom Freezer Fridge 365L", amount = 440000, qty = 7 },
            new { id = 25, branchId = 5, name = "De'Longhi Pump Espresso Maker", amount = 285000, qty = 14 },
            new { id = 26, branchId = 5, name = "Panasonic Convection Oven 27L", amount = 190000, qty = 16 },

            // Rajshahi Branch (id: 6)
            new { id = 27, branchId = 6, name = "Gree 1.0 Ton Lomo Eco Inverter AC", amount = 420000, qty = 10 },
            new { id = 28, branchId = 6, name = "Walton 43\" Google Certified TV", amount = 330000, qty = 11 },
            new { id = 29, branchId = 6, name = "Singer Direct Cool Refrigerator 240L", amount = 290000, qty = 13 },
            new { id = 30, branchId = 6, name = "Symphony Tower Desert Air Cooler", amount = 180000, qty = 19 },
            new { id = 31, branchId = 6, name = "Jaipan 1000W Heavy Duty Mixer Grinder", amount = 120000, qty = 32 },

            // Rangpur Branch (id: 7)
            new { id = 32, branchId = 7, name = "Vision 40\" LED Smart Android TV", amount = 310000, qty = 12 },
            new { id = 33, branchId = 7, name = "Walton Double Door Fridge 220L", amount = 275000, qty = 14 },
            new { id = 34, branchId = 7, name = "Midea 1.0 Ton Fast Cool Inverter AC", amount = 260000, qty = 7 },
            new { id = 35, branchId = 7, name = "Kiam Electric Infrared Cooker", amount = 95000, qty = 30 },

            // Mymensingh Branch (id: 8)
            new { id = 36, branchId = 8, name = "Haier 1.5 Ton Triple Inverter AC", amount = 440000, qty = 8 },
            new { id = 37, branchId = 8, name = "Sony 32\" Smart HD TV", amount = 280000, qty = 14 },
            new { id = 38, branchId = 8, name = "Walton Glass Door Refrigerator 213L", amount = 260000, qty = 12 },
            new { id = 39, branchId = 8, name = "Panasonic Automatic Rice Cooker 2.2L", amount = 110000, qty = 28 }
        };

        if (branchId.HasValue && branchId.Value > 0)
        {
            var branchProducts = allProducts
                .Where(p => p.branchId == branchId.Value)
                .OrderByDescending(p => p.amount)
                .Select(p => new { p.id, p.name, p.amount, p.qty });
            return Json(branchProducts);
        }

        // All branches: aggregate top products across all branches
        var topAggregate = allProducts
            .GroupBy(p => p.name)
            .Select(g => new
            {
                id = g.First().id,
                name = g.Key,
                amount = g.Sum(x => x.amount),
                qty = g.Sum(x => x.qty)
            })
            .OrderByDescending(p => p.amount)
            .Take(8);

        return Json(topAggregate);
    }
}
