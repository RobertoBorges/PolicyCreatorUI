using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using PolicyCreatorUI.ViewModels;

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
        public async Task<IActionResult> GeneratePolicies([FromBody] GeneratePoliciesRequest request)
        {
            var policies = new List<object>();

            foreach (var resource in request.Resources)
            {
                string regexPattern = ConvertPatternToRegex(resource.Pattern, resource.Abbreviation);

                var policy = new
                {
                    properties = new
                    {
                        displayName = $"Enforce naming for {resource.Name}",
                        policyType = "Custom",
                        mode = "All",
                        metadata = new
                        {
                            category = "Naming Conventions"
                        },
                        parameters = new { },
                        policyRule = new
                        {
                            @if = new
                            {
                                allOf = new object[]
                                {
                                    new { field = "type", equals = resource.Type },
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

        private string ConvertPatternToRegex(string pattern, string abbreviation)
        {
            string regexPattern = pattern;

            // {n}(max-N) → [0-9]{1,N}
            regexPattern = Regex.Replace(regexPattern, @"\{n\}\(max-(\d+)\)", @"[0-9]{1,$1}");

            // {}(max-N) → [a-zA-Z0-9]{1,N}
            regexPattern = Regex.Replace(regexPattern, @"\{\}\(max-(\d+)\)", @"[a-zA-Z0-9]{1,$1}");

            // {n}(N) → [0-9]{N}
            regexPattern = Regex.Replace(regexPattern, @"\{n\}\((\d+)\)", @"[0-9]{$1}");

            // {}(N) → [a-zA-Z0-9]{N}
            regexPattern = Regex.Replace(regexPattern, @"\{\}\((\d+)\)", @"[a-zA-Z0-9]{$1}");

            // {n} → [0-9]+
            regexPattern = Regex.Replace(regexPattern, @"\{n\}", @"[0-9]+");

            // {} → [a-zA-Z0-9]+
            regexPattern = Regex.Replace(regexPattern, @"\{\}", @"[a-zA-Z0-9]+");

            // Escapa separadores
            regexPattern = Regex.Replace(regexPattern, @"[-_]", m => @"\" + m.Value);

            // Adiciona o prefixo fixo com hífen
            return $"^{Regex.Escape(abbreviation)}-{regexPattern}$";
        }
    }
}