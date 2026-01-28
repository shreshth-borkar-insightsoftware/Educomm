//using Educomm.Data;
//using Educomm.Models;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.AspNetCore.Mvc.Razor;
//using Microsoft.EntityFrameworkCore;
//using Razorpay.Api;
//using System;
//using System.Collections.Generic;
//using System.Security.Cryptography;
//using System.Text;

//namespace Educomm.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class PaymentsController : ControllerBase
//    {
//        private readonly AppDbContext _context;

//        private const string _keyId = rzp_test_S6oPlBqwg8ajku;
//        private const string _keySecret = VHvkRyf64yCgYdyx4uIx841Y;

//        public PaymentsController(AppDbContext context)
//        {
//            _context = context;
//        }

//        [HttpPost("CreateOrder")]
//        [Authorize] 
//        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
//        {
//           }
