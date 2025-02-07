using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Threading.Tasks;

namespace PolicyCreatorUI.Controllers
{
    public class NamingController : Controller
    {
        private static readonly List<dynamic> Resources = new List<dynamic>
        {
            new { name = "Virtual Machine", abbreviation = "vm", provider = "Microsoft.Compute", type = "Microsoft.Compute/virtualMachines" },
            new { name = "Storage Account", abbreviation = "st", provider = "Microsoft.Storage", type = "Microsoft.Storage/storageAccounts" }
        };

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public JsonResult GetResources()
        {
            return Json(Resources);
        }

        [HttpPost]
        public async Task<IActionResult> GeneratePolicies([FromBody] Dictionary<string, List<dynamic>> request)
        {
            var policies = new List<object>();

            foreach (var resource in request["resources"])
            {
                string regexPattern = $"^{resource["pattern"]}$";
                var policy = new
                {
                    properties = new
                    {
                        displayName = $"Enforce naming for {resource["name"]}",
                        policyType = "Custom",
                        mode = "All",
                        policyRule = new
                        {
                            @if = new
                            {
                                allOf = new object[]
                                {
                                    new { field = "type", equals = resource["type"] },
                                    new { field = "name", notMatch = regexPattern }
                                }
                            },
                            then = new { effect = "deny" }
                        }
                    }
                };

                policies.Add(policy);
            }

            return Json(new { policies });
        }
    }
}
